import type { Item, ReleaseFlags, StackItem } from '../../../types/index.js'
import type { Host } from '../../host/host.js'
import { messageOf } from '../../refresh/message-of.js'
import { loadReleaseFlags } from '../../store/load-release-flags.js'
import { saveStackProject } from '../../store/save-stack-project.js'
import type { SummaryJobs } from '../../summaries/summary-jobs.js'
import { flagReleases } from '../classify/flag-releases.js'
import { RELEASE_LIMITS } from '../classify/release-limits.js'
import { isStackItem } from './is-stack-item.js'
import { isSuppressed } from './is-suppressed.js'
import type { StackLoop } from './stack-loop.js'
import { releaseOfStackItem } from './release-of-stack-item.js'

/**
 * Checks the breaking and security flags of the stack items a view shows against the model's reading of their notes (`flagReleases`: cached verdicts need no call, a few calls at most), and writes the flags that changed into the store and state of the project in state; other items are left alone. A release the model gave no verdict for is not asked again for `STACK_LIMITS.failureWindowMs`, so page turns and filter keys while the model is down make no calls. Never throws.
 *
 * @param host the engine
 * @param loop the loop, whose queue orders the stack's writes
 * @param jobs the limiter shared with summaries
 * @param items the items shown
 * @param signal aborts the model calls
 * @returns the flags that changed, by release id
 */
export async function flagShown(
  host: Host,
  loop: StackLoop,
  jobs: SummaryJobs,
  items: readonly Item[],
  signal?: AbortSignal,
): Promise<Map<string, ReleaseFlags>> {
  const changed = new Map<string, ReleaseFlags>()

  try {
    const now = await host.clockNow()
    const keyOf = (item: StackItem) => `flag:${item.release.releaseId}`
    const shown = items.filter(isStackItem).filter(item => !isSuppressed(loop, keyOf(item), now))

    if (shown.length === 0) {
      return changed
    }

    const cachedIds = (entries: readonly { releaseId: string }[]) =>
      new Set(entries.map(entry => entry.releaseId))
    const before = cachedIds(await loadReleaseFlags(host))
    // The releases flagReleases may ask about: never asked, at most one call's worth.
    const asked = shown
      .filter(item => !before.has(item.release.releaseId))
      .slice(0, RELEASE_LIMITS.modelPerCall)
    const flagged = await flagReleases(host, jobs, shown.map(releaseOfStackItem), signal)

    if (asked.length > 0 && signal?.aborted !== true) {
      const after = cachedIds(await loadReleaseFlags(host))

      for (const item of asked) {
        if (after.has(item.release.releaseId)) {
          loop.failedAt.delete(keyOf(item))
        } else {
          loop.failedAt.set(keyOf(item), now)
        }
      }
    }

    flagged.forEach((release, index) => {
      const before = shown[index]?.release

      if (
        before !== undefined &&
        (before.breaking !== release.flags.breaking || before.security !== release.flags.security)
      ) {
        changed.set(release.id, release.flags)
      }
    })

    if (changed.size === 0) {
      return changed
    }

    const withFlags = (item: StackItem): StackItem => {
      const flags = changed.get(item.release.releaseId)

      return flags === undefined ? item : { ...item, release: { ...item.release, ...flags } }
    }

    await loop.serially(async () => {
      const { root } = await host.state.stack.read()

      if (root === null) {
        return
      }

      await saveStackProject(host, root, project => ({
        deps: Object.fromEntries(
          Object.entries(project.deps).map(([key, dep]) => [
            key,
            { ...dep, items: dep.items.map(withFlags) },
          ]),
        ),
      }))
      await host.state.stack.update(current =>
        current.root === root ? { ...current, items: current.items.map(withFlags) } : current,
      )
    })
  } catch (error) {
    host.debug(`herald: deps: could not flag the releases shown: ${messageOf(error)}`)
  }

  return changed
}
