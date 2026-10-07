import type { DepFeed, Dependency, DepResolution } from '../../../types/index.js'
import type { Host } from '../../host/host.js'
import { mapLimited } from '../../refresh/map-limited.js'
import { loadDepFeeds } from '../../store/load-dep-feeds.js'
import { saveDepFeeds } from '../../store/save-dep-feeds.js'
import { depFeedKeyOf } from './dep-feed-key-of.js'
import type { FeedCheck } from './feed-check.js'
import { feedOfRepo } from './feed-of-repo.js'
import { fetchGently } from './fetch-gently.js'
import type { Get } from './get.js'
import { repoOfDependency } from './repo-of-dependency.js'
import { RESOLVE_LIMITS } from './resolve-limits.js'

/**
 * What a resolution says about a package, the package itself aside.
 */
type Outcome = Omit<DepResolution, 'dependency'>

/**
 * The outcome a cached or fresh mapping stands for.
 *
 * @param entry the mapping
 */
function outcomeOf(entry: DepFeed): Outcome {
  const isOverride = entry.isOverride === true

  return {
    status: entry.feed === undefined ? 'unresolved' : 'resolved',
    ...(entry.repo === undefined ? {} : { repo: entry.repo }),
    ...(entry.feed === undefined
      ? { reason: entry.reason ?? 'not checked yet' }
      : { feed: entry.feed }),
    isOverride,
  }
}

/**
 * The error's message.
 *
 * @param error anything thrown
 */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Resolves each dependency to its release feed: a user override wins, a cached mapping younger than the TTL (negative ones included) is used without a request, and the rest are looked up in their registry, two packages at a time, then checked on GitHub (`releases.atom`, else `tags.atom`), one check per repository. Definite answers are cached; a failure worth retrying is not, and falls back to a stale feed when there is one. Never throws: an unresolvable package is listed as unresolved with the reason.
 *
 * @param host the engine
 * @param dependencies the followed dependencies
 * @param signal stops further requests and backoff waits
 * @returns one resolution per dependency, in input order
 */
export async function resolveDeps(
  host: Host,
  dependencies: readonly Dependency[],
  signal?: AbortSignal,
): Promise<DepResolution[]> {
  try {
    const cached = await loadDepFeeds(host)
    const now = await host.clockNow()
    const updates: Record<string, DepFeed> = {}
    const byKey = new Map<string, Promise<Outcome>>()
    const feedChecks = new Map<string, Promise<FeedCheck>>()
    const get: Get = url => fetchGently(host, url, signal)

    const isFresh = (entry: DepFeed) =>
      now - entry.resolvedAt >= 0 && now - entry.resolvedAt < RESOLVE_LIMITS.ttlMs

    const checkFeed = (repo: string): Promise<FeedCheck> => {
      const id = repo.toLowerCase()
      const running = feedChecks.get(id)

      if (running !== undefined) {
        return running
      }

      const known = Object.values(cached).find(
        entry => entry.repo?.toLowerCase() === id && entry.feed !== undefined && isFresh(entry),
      )?.feed
      const check: Promise<FeedCheck> =
        known === undefined ? feedOfRepo(get, repo) : Promise.resolve({ kind: 'feed', feed: known })

      feedChecks.set(id, check)

      return check
    }

    const retryLater = (
      key: string,
      entry: DepFeed | undefined,
      reason: string,
      repo = entry?.repo,
    ): Outcome => {
      if (reason !== 'cancelled') {
        host.debug(`news: deps: could not resolve ${key}: ${reason}`)
      }

      return entry?.feed === undefined
        ? {
            status: 'unresolved',
            ...(repo === undefined ? {} : { repo }),
            reason,
            isOverride: entry?.isOverride === true,
          }
        : outcomeOf(entry)
    }

    const resolveOne = async (dependency: Dependency): Promise<Outcome> => {
      const key = depFeedKeyOf(dependency)
      const entry = Object.hasOwn(cached, key) ? cached[key] : undefined

      if (entry?.isOverride === true && entry.repo === undefined) {
        return outcomeOf(entry)
      }

      if (
        entry !== undefined &&
        isFresh(entry) &&
        (entry.feed !== undefined || entry.reason !== undefined)
      ) {
        return outcomeOf(entry)
      }

      const isOverride = entry?.isOverride === true
      const lookup =
        isOverride && entry?.repo !== undefined
          ? ({ kind: 'repo', repo: entry.repo } as const)
          : await repoOfDependency(get, dependency)

      if (lookup.kind === 'failed') {
        return retryLater(key, entry, lookup.reason)
      }

      if (lookup.kind === 'none') {
        const negative: DepFeed = { reason: lookup.reason, resolvedAt: now }

        updates[key] = negative

        return outcomeOf(negative)
      }

      const check = await checkFeed(lookup.repo)

      if (check.kind === 'failed') {
        return retryLater(key, entry, check.reason, lookup.repo)
      }

      const next: DepFeed = {
        repo: lookup.repo,
        ...(check.kind === 'feed' ? { feed: check.feed } : { reason: check.reason }),
        resolvedAt: now,
        ...(isOverride ? { isOverride: true } : {}),
      }

      updates[key] = next

      return outcomeOf(next)
    }

    const resolutions = await mapLimited(
      dependencies,
      RESOLVE_LIMITS.concurrentPackages,
      async (dependency): Promise<DepResolution> => {
        const key = depFeedKeyOf(dependency)
        const outcome =
          byKey.get(key) ??
          resolveOne(dependency).catch((error: unknown): Outcome => ({
            status: 'unresolved',
            reason: messageOf(error),
            isOverride: false,
          }))

        byKey.set(key, outcome)

        return { dependency, ...(await outcome) }
      },
    )

    if (Object.keys(updates).length > 0) {
      await saveDepFeeds(host, updates).catch((error: unknown) => {
        host.debug(`news: deps: could not cache feed mappings: ${messageOf(error)}`)
      })
    }

    return resolutions
  } catch (error) {
    host.debug(`news: deps: resolution failed: ${messageOf(error)}`)

    return dependencies.map(dependency => ({
      dependency,
      status: 'unresolved',
      reason: messageOf(error),
      isOverride: false,
    }))
  }
}
