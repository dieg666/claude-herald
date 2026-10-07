import type { Host } from '../host/host.js'
import { mergeItems } from '../items/merge-items.js'
import { loadSources } from '../store/load-sources.js'
import { mapLimited } from './map-limited.js'
import { messageOf } from './message-of.js'
import { REFRESH_LIMITS } from './refresh-limits.js'
import type { RefreshLoop } from './refresh-loop.js'
import type { RefreshRun } from './refresh-run.js'
import { refreshSource } from './refresh-source.js'
import { serialOf } from './serial-of.js'
import { toastTextOf } from './toast-text-of.js'

const SKIPPED: RefreshRun = { isSkipped: true, newItems: [], errors: {} }

/**
 * Refreshes every enabled source, a few at a time, then records the run in status, shows one toast for the new items and hands them to the loop's `onRun`; skipped while another run is in flight; never throws.
 *
 * @param host the engine
 * @param loop the loop the run belongs to
 */
export async function refreshAll(host: Host, loop: RefreshLoop): Promise<RefreshRun> {
  if (loop.run !== undefined) {
    return SKIPPED
  }

  const controller = new AbortController()

  loop.run = controller

  try {
    await host.state.status.update(status => ({ ...status, isRefreshing: true }))

    const sources = (await loadSources(host)).filter(source => source.isEnabled)
    const serially = serialOf()

    const outcomes = await mapLimited(sources, REFRESH_LIMITS.concurrentSources, source =>
      refreshSource(host, source, controller.signal, serially),
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

    await host.state.status.update(() => ({ lastRefreshAt, isRefreshing: false, errors }))

    if (newItems.length > 0) {
      host.toast(toastTextOf(newItems))
    }

    const run: RefreshRun = { isSkipped: false, newItems, errors }

    try {
      await loop.onRun?.(host, run)
    } catch (error) {
      host.debug(`news: after the refresh: ${messageOf(error)}`)
    }

    return run
  } catch (error) {
    host.debug(`news: the refresh failed: ${messageOf(error)}`)

    await host.state.status
      .update(status => ({ ...status, isRefreshing: false }))
      .catch(() => undefined)

    return { isSkipped: false, newItems: [], errors: {} }
  } finally {
    if (loop.run === controller) {
      loop.run = undefined
    }
  }
}
