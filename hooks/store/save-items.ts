import type { Item, ItemsBySource } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { itemsBySourceOf } from './items-by-source-of.js'

/**
 * Replaces one source's items, reading the store right before writing so other sources' items stay.
 *
 * @param host the engine
 * @param sourceId the source
 * @param items its items, newest first
 * @returns every source's items as stored now
 */
export async function saveItems(
  host: Host,
  sourceId: string,
  items: readonly Item[],
): Promise<ItemsBySource> {
  const next = {
    ...itemsBySourceOf(await host.storeGet(STORE_KEYS.items)),
    [sourceId]: [...items],
  }

  await host.storeSet(STORE_KEYS.items, next)

  return next
}
