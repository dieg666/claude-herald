import { DEFAULT_SETTINGS } from '../defaults/default-settings.js'
import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import { loadSettings } from '../store/load-settings.js'
import { handShownPage } from './hand-shown-page.js'
import type { Rotation } from './rotation.js'
import { turnBand } from './turn-band.js'

/**
 * Replaces the rotation's timer with one every `rotateSeconds` of the stored settings (at least one second), then hands the page shown now to `onPage`; never throws.
 *
 * @param host the engine
 * @param rotation the rotation whose timer it replaces
 */
export async function restartRotation(host: Host, rotation: Rotation): Promise<void> {
  const seconds = await loadSettings(host).then(
    settings => settings.rotateSeconds,
    () => DEFAULT_SETTINGS.rotateSeconds,
  )

  // No await between cancelling and replacing, so restarts that overlap leave one timer.
  rotation.timer?.cancel()
  rotation.timer = undefined

  try {
    rotation.timer = host.clockEvery(Math.max(1, seconds) * 1000, () => {
      void turnBand(host, rotation, 'rotate')
    })
  } catch (error) {
    host.debug(`news: could not start the band rotation: ${messageOf(error)}`)
  }

  await handShownPage(host, rotation)
}
