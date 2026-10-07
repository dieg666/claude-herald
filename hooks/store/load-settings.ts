import type { Settings } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { settingsOf } from './settings-of.js'

/**
 * The stored settings, defaults filling whatever is missing.
 *
 * @param host the engine
 */
export async function loadSettings(host: Host): Promise<Settings> {
  return settingsOf(await host.storeGet(STORE_KEYS.settings))
}
