import type { ItemsBySource } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { itemsBySourceOf } from './items-by-source-of.js'

/**
 * The last items of every source, newest first.
 *
 * @param host the engine
 */
export async function loadItems(host: Host): Promise<ItemsBySource> {
  return itemsBySourceOf(await host.storeGet(STORE_KEYS.items))
}
