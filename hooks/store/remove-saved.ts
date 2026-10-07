import type { SavedItem } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { savedOf } from './saved-of.js'

/**
 * Removes a saved item by id, reading the store right before writing.
 *
 * @param host the engine
 * @param id the item's id
 * @returns the saved list as stored now
 */
export async function removeSaved(host: Host, id: string): Promise<SavedItem[]> {
  const saved = savedOf(await host.storeGet(STORE_KEYS.saved))
  const next = saved.filter(entry => entry.id !== id)

  if (next.length !== saved.length) {
    await host.storeSet(STORE_KEYS.saved, next)
  }

  return next
}
