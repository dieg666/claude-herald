import type { Host } from '../host/host.js'
import { mergeItems } from '../items/merge-items.js'
import { loadSources } from '../store/load-sources.js'
import { mapLimited } from './map-limited.js'
import { messageOf } from './message-of.js'
import { REFRESH_LIMITS } from './refresh-limits.js'
import type { RefreshLoop } from './refresh-loop.js'
import type { RefreshRun } from './refresh-run.js'
import { refreshSource } from './refresh-source.js'
import type { SourceOutcome } from './source-outcome.js'
import { serialOf } from './serial-of.js'
import { toastTextOf } from './toast-text-of.js'
import { withinDeadline } from './within-deadline.js'

const SKIPPED: RefreshRun = { isSkipped: true, newItems: [], errors: {} }

/**
 * Whether another run than this one is in flight, what status shows once this one ends.
 *
 * @param loop the loop
 * @param controller this run's
 */
function isOtherRunning(loop: RefreshLoop, controller: AbortController): boolean {
  return loop.run !== undefined && loop.run !== controller
}

/**
 * One run's work: every enabled source a few at a time, each within its deadline, then status, the toast and `onRun` with the run's signal; never rejects.
 *
 * @param host the engine
 * @param loop the loop the run belongs to
 * @param controller the run's, its signal passed to model calls
 */
async function runOf(
  host: Host,
  loop: RefreshLoop,
  controller: AbortController,
): Promise<RefreshRun> {
  try {
    await host.state.status.update(status => ({ ...status, isRefreshing: true }))

    const sources = (await loadSources(host)).filter(source => source.isEnabled)
    const serially = serialOf()

    const outcomes = await mapLimited(sources, REFRESH_LIMITS.concurrentSources, source =>
      withinDeadline(
        host,
        REFRESH_LIMITS.sourceTimeoutMs,
        refreshSource(host, source, controller.signal, serially),
        (): SourceOutcome => {
          host.debug(`news: ${source.name}: timed out`)

          return { newItems: [], error: 'timed out' }
        },
      ),
    )

    const fresh = outcomes.flatMap(outcome => outcome.newItems)
    const newItems = mergeItems([], fresh, fresh.length)

    const errors = Object.fromEntries(
      sources.flatMap((source, index) => {
        const error = outcomes[index]?.error

        return error === undefined ? [] : [[source.id, error]]
      }),
    )

    const lastRefreshAt = await host.clockNow()

    await host.state.status.update(() => ({
      lastRefreshAt,
      isRefreshing: isOtherRunning(loop, controller),
      errors,
    }))

    if (newItems.length > 0) {
      host.toast(toastTextOf(newItems))
    }

    const run: RefreshRun = { isSkipped: false, newItems, errors }

    try {
      await loop.onRun?.(host, run, controller.signal)
    } catch (error) {
      host.debug(`news: after the refresh: ${messageOf(error)}`)
    }

    return run
  } catch (error) {
    host.debug(`news: the refresh failed: ${messageOf(error)}`)

    await host.state.status
      .update(status => ({ ...status, isRefreshing: isOtherRunning(loop, controller) }))
      .catch(() => undefined)

    return { isSkipped: false, newItems: [], errors: {} }
  }
}

/**
 * Refreshes every enabled source, a few at a time, then records the run in status, shows one toast for the new items and hands them to the loop's `onRun`; skipped while another run is in flight; a run past its deadline is aborted and lets the next one start; never throws.
 *
 * @param host the engine
 * @param loop the loop the run belongs to
 */
export async function refreshAll(host: Host, loop: RefreshLoop): Promise<RefreshRun> {
  if (loop.run !== undefined) {
    return SKIPPED
  }

  const controller = new AbortController()
  let isLate = false

  loop.run = controller

  const run = await withinDeadline(
    host,
    REFRESH_LIMITS.runTimeoutMs,
    runOf(host, loop, controller),
    (): RefreshRun => {
      isLate = true
      controller.abort()
      host.debug('news: the refresh timed out')

      return { isSkipped: false, newItems: [], errors: {} }
    },
  )

  if (loop.run === controller) {
    loop.run = undefined
  }

  if (isLate) {
    // Not awaited: the state write may be what hangs.
    void host.state.status
      .update(status => ({ ...status, isRefreshing: loop.run !== undefined }))
      .catch(() => undefined)
  }

  return run
}
