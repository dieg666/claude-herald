import type { Settings } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'

/**
 * Saves the settings whole.
 *
 * @param host the engine
 * @param settings every field
 */
export async function saveSettings(host: Host, settings: Settings): Promise<void> {
  await host.storeSet(STORE_KEYS.settings, settings)
}
