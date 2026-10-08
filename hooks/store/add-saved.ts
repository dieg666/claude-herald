import type { Item, SavedItem } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { savedOf } from './saved-of.js'

/**
 * Saves an item for later at the head of the list (a stack item with its release), reading the store right before writing; an item already saved stays as it was.
 *
 * @param host the engine
 * @param item the item to save
 * @param savedAt when (ms since the epoch)
 * @returns the saved list as stored now
 */
export async function addSaved(host: Host, item: Item, savedAt: number): Promise<SavedItem[]> {
  const saved = savedOf(await host.storeGet(STORE_KEYS.saved))
  const [entry] = savedOf([{ ...item, savedAt }])

  if (entry === undefined || saved.some(other => other.id === item.id)) {
    return saved
  }

  const next = [entry, ...saved]

  await host.storeSet(STORE_KEYS.saved, next)

  return next
}
