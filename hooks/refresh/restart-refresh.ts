import { DEFAULT_SETTINGS } from '../defaults/default-settings.js'
import type { Host } from '../host/host.js'
import { loadSettings } from '../store/load-settings.js'
import { messageOf } from './message-of.js'
import { refreshAll } from './refresh-all.js'
import type { RefreshLoop } from './refresh-loop.js'
import type { RefreshRun } from './refresh-run.js'

/**
 * Replaces the loop's timer with one every `refreshMinutes` of the stored settings, then starts one refresh; never throws.
 *
 * @param host the engine
 * @param loop the loop whose timer it replaces
 * @returns the refresh it started, skipped when one was already in flight
 */
export async function restartRefresh(host: Host, loop: RefreshLoop): Promise<RefreshRun> {
  const minutes = await loadSettings(host).then(
    settings => settings.refreshMinutes,
    () => DEFAULT_SETTINGS.refreshMinutes,
  )

  // No await between cancelling and replacing, so restarts that overlap leave one timer.
  loop.timer?.cancel()
  loop.timer = undefined

  try {
    loop.timer = host.clockEvery(minutes * 60_000, () => {
      void refreshAll(host, loop)
    })
  } catch (error) {
    host.debug(`news: could not start the refresh timer: ${messageOf(error)}`)
  }

  return refreshAll(host, loop)
}
