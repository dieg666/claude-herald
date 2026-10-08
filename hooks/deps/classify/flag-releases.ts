import type { ReleaseFlags } from '../../../types/index.js'
import type { Host } from '../../host/host.js'
import { messageOf } from '../../refresh/message-of.js'
import { loadReleaseFlags } from '../../store/load-release-flags.js'
import { putReleaseFlags } from '../../store/put-release-flags.js'
import { runLimited } from '../../summaries/run-limited.js'
import type { SummaryJobs } from '../../summaries/summary-jobs.js'
import type { ClassifiedRelease } from './classified-release.js'
import { releaseFlagsOfReply } from './release-flags-of-reply.js'
import { releaseFlagsRequestOf } from './release-flags-request-of.js'
import { RELEASE_LIMITS } from './release-limits.js'

/**
 * The model's cached verdict on a release, read from the store now.
 *
 * @param host the engine
 * @param id the release id
 */
async function cachedOf(host: Host, id: string): Promise<ReleaseFlags | undefined> {
  const entry = (await loadReleaseFlags(host)).find(other => other.releaseId === id)

  return entry === undefined ? undefined : { breaking: entry.breaking, security: entry.security }
}

/**
 * The release with the model's flags added to its keyword flags; the model can raise a flag, never clear one.
 *
 * @param release the release
 * @param flags the model's verdict
 */
function withFlags(release: ClassifiedRelease, flags: ReleaseFlags): ClassifiedRelease {
  return {
    ...release,
    flags: {
      breaking: release.flags.breaking || flags.breaking,
      security: release.flags.security || flags.security,
    },
  }
}

/**
 * Asks the model about a release's notes, once a slot is free, and caches a well-formed answer.
 *
 * @param host the engine
 * @param jobs the limiter and write queue
 * @param release the release
 * @param signal aborts the model call
 */
async function requestOf(
  host: Host,
  jobs: SummaryJobs,
  release: ClassifiedRelease,
  signal: AbortSignal | undefined,
): Promise<ReleaseFlags | undefined> {
  if (signal?.aborted === true) {
    return undefined
  }

  // A request that waited for a slot may find the verdict cached meanwhile, by another session too.
  const cached = await cachedOf(host, release.id)

  if (cached !== undefined) {
    return cached
  }

  const { system, prompt } = releaseFlagsRequestOf(release)
  const reply = await host.modelComplete(
    {
      model: 'haiku',
      system,
      prompt,
      maxTokens: RELEASE_LIMITS.maxTokens,
      timeoutMs: RELEASE_LIMITS.timeoutMs,
      effort: 'low',
    },
    signal,
  )

  if (!reply.isAnswered) {
    host.debug(`news: no release flags for ${release.id}: ${reply.reason}`)

    return undefined
  }

  const flags = releaseFlagsOfReply(reply.text)

  if (flags === undefined) {
    host.debug(`news: no release flags for ${release.id}: malformed reply`)

    return undefined
  }

  try {
    await jobs.serially(() => putReleaseFlags(host, { releaseId: release.id, ...flags }))
  } catch (error) {
    host.debug(`news: could not keep the release flags of ${release.id}: ${messageOf(error)}`)
  }

  return flags
}

/**
 * Adds the model's breaking and security reading of the notes to releases a view shows: a cached verdict needs no call; otherwise one Haiku request per release through the limiter shared with summaries (keys `release|<id>`), at most a few per call in the order given, cached by release id when the answer is exactly the expected JSON. A release the model gives no usable answer for keeps its keyword flags, uncached, so a later call retries; never throws.
 *
 * @param host the engine
 * @param jobs the limiter and write queue shared with summaries
 * @param releases the releases shown, from `classifyReleases` (so never a hidden one)
 * @param signal aborts the model calls
 * @returns the same releases in the same order, flags updated
 */
export async function flagReleases(
  host: Host,
  jobs: SummaryJobs,
  releases: readonly ClassifiedRelease[],
  signal?: AbortSignal,
): Promise<ClassifiedRelease[]> {
  let cache: Map<string, ReleaseFlags>

  try {
    cache = new Map(
      (await loadReleaseFlags(host)).map(entry => [
        entry.releaseId,
        { breaking: entry.breaking, security: entry.security },
      ]),
    )
  } catch (error) {
    host.debug(`news: could not read the release flags: ${messageOf(error)}`)

    return [...releases]
  }

  let asked = 0

  return Promise.all(
    releases.map(async release => {
      const cached = cache.get(release.id)

      if (cached !== undefined) {
        return withFlags(release, cached)
      }

      if (asked >= RELEASE_LIMITS.modelPerCall) {
        return release
      }

      asked += 1

      try {
        const flags = await runLimited(jobs.limiter, `release|${release.id}`, () =>
          requestOf(host, jobs, release, signal),
        )

        return flags === undefined ? release : withFlags(release, flags)
      } catch (error) {
        host.debug(`news: no release flags for ${release.id}: ${messageOf(error)}`)

        return release
      }
    }),
  )
}
