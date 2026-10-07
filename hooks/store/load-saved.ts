import type { SavedItem } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { savedOf } from './saved-of.js'

/**
 * The items saved for later, most recently saved first.
 *
 * @param host the engine
 */
export async function loadSaved(host: Host): Promise<SavedItem[]> {
  return savedOf(await host.storeGet(STORE_KEYS.saved))
}
