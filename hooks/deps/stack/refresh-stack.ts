import type {
  Dependency,
  DepResolution,
  StackDep,
  StackItem,
  StackProject,
} from '../../../types/index.js'
import { parseFeed } from '../../feed/parse-feed.js'
import type { Host } from '../../host/host.js'
import { timeOf } from '../../items/time-of.js'
import { mapLimited } from '../../refresh/map-limited.js'
import { messageOf } from '../../refresh/message-of.js'
import { loadDepFeeds } from '../../store/load-dep-feeds.js'
import { loadDepsProject } from '../../store/load-deps-project.js'
import { loadReleaseFlags } from '../../store/load-release-flags.js'
import { loadStackProject } from '../../store/load-stack-project.js'
import { saveStackProject } from '../../store/save-stack-project.js'
import type { SummaryJobs } from '../../summaries/summary-jobs.js'
import type { ClassifiedRelease } from '../classify/classified-release.js'
import { classifyReleases } from '../classify/classify-releases.js'
import { currentVersionOf } from '../classify/current-version-of.js'
import { flagReleases } from '../classify/flag-releases.js'
import { releaseIdOf } from '../classify/release-id-of.js'
import { RELEASE_LIMITS } from '../classify/release-limits.js'
import { detectDeps } from '../detect/detect-deps.js'
import { projectRootOf } from '../detect/project-root-of.js'
import { redetectIfChanged } from '../detect/redetect-if-changed.js'
import { depFeedKeyOf } from '../resolve/dep-feed-key-of.js'
import type { FetchOutcome } from '../resolve/fetch-outcome.js'
import { fetchGently } from '../resolve/fetch-gently.js'
import { resolveDeps } from '../resolve/resolve-deps.js'
import { isAtLevel } from './is-at-level.js'
import { isSuppressed } from './is-suppressed.js'
import { needsLookup } from './needs-lookup.js'
import { STACK_LIMITS } from './stack-limits.js'
import type { StackLoop } from './stack-loop.js'
import type { StackRun } from './stack-run.js'
import { stackItemOfRelease } from './stack-item-of-release.js'
import { stackStateOf } from './stack-state-of.js'
import { stackToastTextOf } from './stack-toast-text-of.js'
import { withCachedFlags } from './with-cached-flags.js'

const SKIPPED: StackRun = { isSkipped: true, checked: [], newReleases: [] }

const NOTHING: StackRun = { isSkipped: false, checked: [], newReleases: [] }

/**
 * One package's release feed as read this run, with its key and address: the id of every entry in feed order, and every release above the version in use, newest first.
 */
type Read = {
  readonly key: string
  readonly dependency: Dependency
  readonly feed: string
  readonly entryIds: readonly string[]
  readonly releases: ClassifiedRelease[]
}

/**
 * Releases newest first, undated ones after in feed order.
 *
 * @param releases the releases in feed order
 */
function newestFirst(releases: readonly ClassifiedRelease[]): ClassifiedRelease[] {
  return releases
    .map((release, index) => ({ release, index, time: timeOf(release.publishedAt) }))
    .sort((a, b) => (a.time === b.time ? a.index - b.index : b.time - a.time))
    .map(({ release }) => release)
}

/**
 * The packages to resolve this run: every one whose mapping needs no request, plus at most `STACK_LIMITS.lookupsPerRun` that do, leaving out those whose lookup failed inside the window.
 *
 * @param host the engine
 * @param loop the loop
 * @param dependencies the followed packages
 * @param now the clock
 */
async function chosenOf(
  host: Host,
  loop: StackLoop,
  dependencies: readonly Dependency[],
  now: number,
): Promise<{ chosen: Dependency[]; lookups: Dependency[] }> {
  const cached = await loadDepFeeds(host)
  const known: Dependency[] = []
  const unknown: Dependency[] = []

  for (const dependency of dependencies) {
    const key = depFeedKeyOf(dependency)

    if (!needsLookup(Object.hasOwn(cached, key) ? cached[key] : undefined, now)) {
      known.push(dependency)
    } else if (!isSuppressed(loop, `lookup:${key}`, now)) {
      unknown.push(dependency)
    }
  }

  const lookups = unknown.slice(0, STACK_LIMITS.lookupsPerRun)

  return { chosen: [...known, ...lookups], lookups }
}

/**
 * Notes which lookups failed, as those still needing one once resolved (a definite answer is cached), so they wait out the window; a cancelled run notes nothing.
 *
 * @param host the engine
 * @param loop the loop
 * @param lookups the packages looked up this run
 * @param now the clock
 * @param signal the run's
 */
async function noteLookups(
  host: Host,
  loop: StackLoop,
  lookups: readonly Dependency[],
  now: number,
  signal: AbortSignal | undefined,
): Promise<void> {
  if (lookups.length === 0 || signal?.aborted === true) {
    return
  }

  const cached = await loadDepFeeds(host)

  for (const dependency of lookups) {
    const key = depFeedKeyOf(dependency)

    if (needsLookup(Object.hasOwn(cached, key) ? cached[key] : undefined, now)) {
      loop.failedAt.set(`lookup:${key}`, now)
    } else {
      loop.failedAt.delete(`lookup:${key}`)
    }
  }
}

/**
 * The resolved packages whose feed is due: never read, read before `STACK_LIMITS.recheckMs`, or read against another version in use; not failed inside the window; the least recently read first, at most `STACK_LIMITS.feedsPerRun`.
 *
 * @param loop the loop
 * @param resolutions this run's resolutions
 * @param stored the project's stored releases
 * @param now the clock
 */
function dueOf(
  loop: StackLoop,
  resolutions: readonly DepResolution[],
  stored: StackProject,
  now: number,
): { key: string; dependency: Dependency; feed: string }[] {
  return resolutions
    .flatMap(resolution => {
      const { dependency, feed } = resolution

      if (feed === undefined || isSuppressed(loop, `feed:${feed}`, now)) {
        return []
      }

      const key = depFeedKeyOf(dependency)
      const entry = Object.hasOwn(stored.deps, key) ? stored.deps[key] : undefined
      const age = entry === undefined ? Number.POSITIVE_INFINITY : now - entry.checkedAt
      const isDue =
        entry === undefined ||
        age < 0 ||
        age >= STACK_LIMITS.recheckMs ||
        entry.current !== currentVersionOf(dependency)

      return isDue ? [{ key, dependency, feed, checkedAt: entry?.checkedAt ?? -Infinity }] : []
    })
    .sort((a, b) => a.checkedAt - b.checkedAt)
    .slice(0, STACK_LIMITS.feedsPerRun)
    .map(({ key, dependency, feed }) => ({ key, dependency, feed }))
}

/**
 * Reads one package's release feed (each address once per run), parsed with the long notes the classifier needs; a failure is logged and noted so the feed waits out the window, a feed gone (404) holds no release.
 *
 * @param host the engine
 * @param loop the loop
 * @param due the package and its feed
 * @param bodies this run's reads by address
 * @param now the clock
 * @param signal the run's
 */
async function readOf(
  host: Host,
  loop: StackLoop,
  due: { key: string; dependency: Dependency; feed: string },
  bodies: Map<string, Promise<FetchOutcome>>,
  now: number,
  signal: AbortSignal | undefined,
): Promise<Read | undefined> {
  const { key, dependency, feed } = due
  const outcome = bodies.get(feed) ?? fetchGently(host, feed, signal)

  bodies.set(feed, outcome)

  const fetched = await outcome
  const failure = (reason: string) => {
    if (reason !== 'cancelled') {
      loop.failedAt.set(`feed:${feed}`, now)
      host.debug(`herald: deps: ${key}: release feed: ${reason}`)
    }

    return undefined
  }

  if (fetched.kind === 'failed') {
    return failure(fetched.reason)
  }

  if (fetched.kind === 'missing') {
    loop.failedAt.delete(`feed:${feed}`)

    return { key, dependency, feed, entryIds: [], releases: [] }
  }

  const parsed = parseFeed(fetched.text, feed, { summaryChars: RELEASE_LIMITS.notesChars })

  if (!parsed.ok) {
    return failure(`not a feed (${parsed.reason})`)
  }

  loop.failedAt.delete(`feed:${feed}`)

  return {
    key,
    dependency,
    feed,
    entryIds: parsed.feed.entries.map(entry => releaseIdOf(dependency, entry)),
    releases: newestFirst(classifyReleases(dependency, parsed.feed.entries)),
  }
}

/**
 * The page a release feed's address stands for, where a release without a link is read.
 *
 * @param feed the release feed
 */
function pageOf(feed: string): string {
  return feed.replace(/\.atom$/, '')
}

/**
 * One package's stored entry after a read: its newest kept releases, the id of every entry the feed lists remembered first, the read stamped.
 *
 * @param read the read
 * @param flagged the releases with their flags, by id
 * @param before the entry stored now
 * @param now the clock
 */
function entryOf(
  read: Read,
  flagged: ReadonlyMap<string, ClassifiedRelease>,
  before: StackDep | undefined,
  now: number,
): StackDep {
  const current = currentVersionOf(read.dependency)

  return {
    checkedAt: now,
    ...(current === undefined ? {} : { current }),
    seen: [...new Set([...read.entryIds, ...(before?.seen ?? [])])].slice(
      0,
      STACK_LIMITS.seenPerDep,
    ),
    items: read.releases
      .slice(0, STACK_LIMITS.itemsPerDep)
      .map(release => stackItemOfRelease(flagged.get(release.id) ?? release, pageOf(read.feed))),
  }
}

/**
 * The project's stored releases with this run's entries in, packages no longer followed out, and at most `STACK_LIMITS.itemsPerProject` releases across packages, the newest kept.
 *
 * @param before the record stored now
 * @param reads this run's reads
 * @param flagged the releases with their flags, by id
 * @param followed the keys of the followed packages
 * @param now the clock
 */
function projectAfter(
  before: StackProject,
  reads: readonly Read[],
  flagged: ReadonlyMap<string, ClassifiedRelease>,
  followed: ReadonlySet<string>,
  now: number,
): Omit<StackProject, 'refreshedAt'> {
  const deps: Record<string, StackDep> = Object.fromEntries(
    Object.entries(before.deps).filter(([key]) => followed.has(key)),
  )

  for (const read of reads) {
    deps[read.key] = entryOf(read, flagged, deps[read.key], now)
  }

  const kept = new Set(
    Object.values(deps)
      .flatMap(dep => dep.items)
      .map((item, index) => ({ id: item.id, index, time: timeOf(item.publishedAt) }))
      .sort((a, b) => (a.time === b.time ? a.index - b.index : b.time - a.time))
      .slice(0, STACK_LIMITS.itemsPerProject)
      .map(({ id }) => id),
  )

  return {
    deps: Object.fromEntries(
      Object.entries(deps).map(([key, dep]) => [
        key,
        { ...dep, items: dep.items.filter(item => kept.has(item.id)) },
      ]),
    ),
  }
}

/**
 * One stack refresh's work; never rejects.
 *
 * @param host the engine
 * @param loop the loop
 * @param jobs the limiter shared with summaries
 * @param signal stops requests, waits and model calls
 * @param redetect whether to check the manifests for changes first (a rescan asked detects again whatever they say)
 */
async function runOf(
  host: Host,
  loop: StackLoop,
  jobs: SummaryJobs,
  signal: AbortSignal | undefined,
  redetect: boolean,
): Promise<StackRun> {
  try {
    if (loop.isDetectPending) {
      loop.isDetectPending = false
      await detectDeps(host)
    } else if (redetect) {
      await redetectIfChanged(host)
    }

    const root = await projectRootOf(host)

    if (root === undefined) {
      return NOTHING
    }

    loop.root = root.path

    const project = await loadDepsProject(host, root.path)

    if (!project.settings.isEnabled) {
      const stored = await loadStackProject(host, root.path)

      await host.state.stack.update(current => stackStateOf(root.path, project, stored, current))

      return NOTHING
    }

    const now = await host.clockNow()
    const { chosen, lookups } = await chosenOf(host, loop, project.dependencies, now)
    const resolutions = chosen.length === 0 ? [] : await resolveDeps(host, chosen, signal)

    await noteLookups(host, loop, lookups, now, signal)

    // Turned off while the lookups ran: no feed is read, and state follows at once.
    const before = await loadDepsProject(host, root.path)

    if (!before.settings.isEnabled) {
      await loop.serially(async () => {
        const kept = await loadStackProject(host, root.path)

        await host.state.stack.update(current => stackStateOf(root.path, before, kept, current))
      })

      return NOTHING
    }

    const stored = await loadStackProject(host, root.path)
    const due = dueOf(loop, resolutions, stored, now)
    const bodies = new Map<string, Promise<FetchOutcome>>()
    const reads = (
      await mapLimited(due, STACK_LIMITS.concurrentFeeds, entry =>
        readOf(host, loop, entry, bodies, now, signal),
      )
    ).flatMap(read => (read === undefined ? [] : [read]))

    const cache = await loadReleaseFlags(host)
    const cachedReads = reads.map(read => ({
      ...read,
      releases: withCachedFlags(read.releases, cache),
    }))

    // Until a package's feed has listed an entry, a read marks its releases seen and is silent, as a source's first load is.
    const fresh = cachedReads.flatMap(read => {
      const before = Object.hasOwn(stored.deps, read.key) ? stored.deps[read.key] : undefined
      const seen = new Set(before?.seen)

      return seen.size === 0
        ? []
        : read.releases
            .slice(0, STACK_LIMITS.itemsPerDep)
            .filter(release => !seen.has(release.id))
            .map(release => ({ release, page: pageOf(read.feed) }))
    })

    const flagged = new Map(
      (fresh.length === 0
        ? []
        : await flagReleases(
            host,
            jobs,
            fresh.map(({ release }) => release),
            signal,
          )
      ).map(release => [release.id, release]),
    )

    // Settings or packages a command changed during this run win over those it started with.
    let latest = project
    let written = new Set<string>()

    await loop.serially(async () => {
      latest = await loadDepsProject(host, root.path)

      const followed = new Set(latest.dependencies.map(depFeedKeyOf))
      const mappings = await loadDepFeeds(host)
      // A package mapped to another feed during this run keeps nothing from the old one.
      const isCurrent = (read: Read) => {
        const entry = Object.hasOwn(mappings, read.key) ? mappings[read.key] : undefined

        return entry?.isOverride !== true || entry.feed === read.feed
      }
      const kept = cachedReads.filter(read => followed.has(read.key) && isCurrent(read))

      written = new Set(kept.map(read => read.key))

      const saved = await saveStackProject(host, root.path, before =>
        projectAfter(before, kept, flagged, followed, now),
      )

      await host.state.stack.update(current =>
        stackStateOf(root.path, latest, saved, current, mappings),
      )
    })

    const newReleases: StackItem[] = fresh.map(({ release, page }) =>
      stackItemOfRelease(flagged.get(release.id) ?? release, page),
    )
    const toasted = newReleases
      .filter(item => latest.settings.isEnabled && written.has(depFeedKeyOf(item.release)))
      .filter(item => isAtLevel(item.release, latest.settings.toastLevel))
      .map((item, index) => ({
        item,
        index,
        isAlert: item.release.breaking || item.release.security,
      }))
      .sort((a, b) => Number(b.isAlert) - Number(a.isAlert) || a.index - b.index)
      .map(({ item }) => item)
    const toast = stackToastTextOf(toasted)

    if (toast !== '') {
      host.toast(toast)
    }

    return {
      isSkipped: false,
      checked: cachedReads.map(read => read.key),
      newReleases,
      ...(toast === '' ? {} : { toast }),
    }
  } catch (error) {
    host.debug(`herald: deps: the stack refresh failed: ${messageOf(error)}`)

    return NOTHING
  }
}

/**
 * Refreshes the releases of the project's stack, off any hook's dispatch: checks the manifests for changes when asked (`redetect`), resolves the followed packages (at most a few registry lookups, none for a package whose lookup failed within the hour), reads the due release feeds (a few per run, with the notes long enough for the classifier), classifies their releases against the versions in use, keeps the newest few per package in the store and state, asks the model about the flags of the releases new since the last read (none on a package's first read), and shows one toast for those at the project's toast level. Does nothing before the start detection or while the project's stack is off (no request at all then); a refresh asked while one runs makes one more run after it, which detects the stack again first when a rescan was asked (`isDetectPending`); settings or packages changed during a run are those it writes and toasts by; never throws.
 *
 * @param host the engine
 * @param loop the loop
 * @param jobs the limiter shared with summaries
 * @param signal stops requests, waits and model calls
 * @param options `redetect`: check the manifests for changes first
 */
export async function refreshStack(
  host: Host,
  loop: StackLoop,
  jobs: SummaryJobs,
  signal?: AbortSignal,
  options: { readonly redetect?: boolean } = {},
): Promise<StackRun> {
  if (!loop.isStarted) {
    return SKIPPED
  }

  if (loop.running !== undefined) {
    loop.isPending = true

    return SKIPPED
  }

  const running = (async () => {
    let run: StackRun

    do {
      loop.isPending = false
      run = await runOf(host, loop, jobs, signal, options.redetect === true)
    } while (loop.isPending && signal?.aborted !== true)

    return run
  })()

  loop.running = running

  try {
    return await running
  } finally {
    loop.running = undefined
  }
}
