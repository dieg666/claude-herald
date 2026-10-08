import type { ReleaseFlags, ReleaseFlagsEntry } from '../../../types/index.js'
import type { Host } from '../../host/host.js'
import { messageOf } from '../../refresh/message-of.js'
import { loadReleaseFlags } from '../../store/load-release-flags.js'
import { putReleaseFlags } from '../../store/put-release-flags.js'
import { runLimited } from '../../summaries/run-limited.js'
import type { SummaryJobs } from '../../summaries/summary-jobs.js'
import type { ClassifiedRelease } from './classified-release.js'
import { hasAdvisoryId } from './has-advisory-id.js'
import { releaseFlagsOfReply } from './release-flags-of-reply.js'
import { releaseFlagsRequestOf } from './release-flags-request-of.js'
import { RELEASE_LIMITS } from './release-limits.js'

/**
 * What the cache says about a release: the model's flags, keyword flags for good (it answered malformed too often), or worth asking again.
 */
type Verdict = { kind: 'model'; flags: ReleaseFlags } | { kind: 'keywords' } | { kind: 'retry' }

/**
 * The verdict a cache entry stands for; undefined when the release was never asked.
 *
 * @param entry the cached entry
 */
function verdictOf(entry: ReleaseFlagsEntry | undefined): Verdict | undefined {
  if (entry === undefined) {
    return undefined
  }

  if (entry.malformed === undefined) {
    return { kind: 'model', flags: { breaking: entry.breaking, security: entry.security } }
  }

  return entry.malformed >= RELEASE_LIMITS.malformedTries ? { kind: 'keywords' } : { kind: 'retry' }
}

/**
 * The cache entry of a release, read from the store now.
 *
 * @param host the engine
 * @param id the release id
 */
async function entryOf(host: Host, id: string): Promise<ReleaseFlagsEntry | undefined> {
  return (await loadReleaseFlags(host)).find(entry => entry.releaseId === id)
}

/**
 * Whether the model could change nothing: the keywords already flag both, and an advisory id keeps security set whatever it says.
 *
 * @param release the release
 */
function isSettled(release: ClassifiedRelease): boolean {
  return (
    release.flags.breaking &&
    release.flags.security &&
    hasAdvisoryId(`${release.title}\n${release.notes}`)
  )
}

/**
 * The release with a verdict applied: the model's flags replace the keyword ones, except that an advisory id in the title or notes always sets security; any other verdict leaves the keyword flags.
 *
 * @param release the release
 * @param verdict what is known
 */
function withVerdict(release: ClassifiedRelease, verdict: Verdict | undefined): ClassifiedRelease {
  if (verdict?.kind !== 'model') {
    return release
  }

  return {
    ...release,
    flags: {
      breaking: verdict.flags.breaking,
      security: verdict.flags.security || hasAdvisoryId(`${release.title}\n${release.notes}`),
    },
  }
}

/**
 * Counts a malformed answer in the cache, unless a verdict arrived meanwhile; reads the store right before writing.
 *
 * @param host the engine
 * @param release the release
 */
async function countMalformed(host: Host, release: ClassifiedRelease): Promise<Verdict> {
  const stored = await entryOf(host, release.id)
  const known = verdictOf(stored)

  if (known !== undefined && known.kind !== 'retry') {
    return known
  }

  const entry = { releaseId: release.id, ...release.flags, malformed: (stored?.malformed ?? 0) + 1 }

  await putReleaseFlags(host, entry)

  return verdictOf(entry) ?? { kind: 'retry' }
}

/**
 * Asks the model about a release's notes, once a slot is free, and caches the answer: a well-formed one as the verdict, a malformed one as a count.
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
): Promise<Verdict | undefined> {
  if (signal?.aborted === true) {
    return undefined
  }

  // A request that waited for a slot may find the verdict cached meanwhile, by another session too.
  const cached = verdictOf(await entryOf(host, release.id))

  if (cached !== undefined && cached.kind !== 'retry') {
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

  try {
    if (flags === undefined) {
      host.debug(`news: no release flags for ${release.id}: malformed reply`)

      return await jobs.serially(() => countMalformed(host, release))
    }

    await jobs.serially(() => putReleaseFlags(host, { releaseId: release.id, ...flags }))
  } catch (error) {
    host.debug(`news: could not keep the release flags of ${release.id}: ${messageOf(error)}`)
  }

  return flags === undefined ? undefined : { kind: 'model', flags }
}

/**
 * Checks the breaking and security flags of releases a view shows against the model's reading of the notes. A cached verdict needs no call, and neither does a release whose keywords flag both with an advisory id. Otherwise one Haiku request per release goes through the limiter shared with summaries (keys `release|<id>`), at most a few per call: never-asked releases first in the order given, then ones whose answer was malformed. A well-formed answer is cached by release id and replaces the keyword flags, except that an advisory id always sets security; a malformed one is counted, and after the second the release keeps its keyword flags for good. A release with no answer keeps its keyword flags, uncached, so a later call retries; never throws.
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
  let entries: Map<string, ReleaseFlagsEntry>

  try {
    entries = new Map((await loadReleaseFlags(host)).map(entry => [entry.releaseId, entry]))
  } catch (error) {
    host.debug(`news: could not read the release flags: ${messageOf(error)}`)

    return [...releases]
  }

  const asking = releases.filter(
    release => verdictOf(entries.get(release.id)) === undefined && !isSettled(release),
  )
  const retrying = releases.filter(
    release => verdictOf(entries.get(release.id))?.kind === 'retry' && !isSettled(release),
  )
  const chosen = new Set(
    [...asking, ...retrying].slice(0, RELEASE_LIMITS.modelPerCall).map(release => release.id),
  )

  return Promise.all(
    releases.map(async release => {
      const cached = verdictOf(entries.get(release.id))

      if (!chosen.has(release.id)) {
        return withVerdict(release, cached)
      }

      try {
        const verdict = await runLimited(jobs.limiter, `release|${release.id}`, () =>
          requestOf(host, jobs, release, signal),
        )

        return withVerdict(release, verdict)
      } catch (error) {
        host.debug(`news: no release flags for ${release.id}: ${messageOf(error)}`)

        return release
      }
    }),
  )
}
