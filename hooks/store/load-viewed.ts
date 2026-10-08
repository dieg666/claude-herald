import type { IdsBySource } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { seenOf } from './seen-of.js'

/**
 * The ids each source tab held when last shown, by source id; a source without an entry has no baseline yet.
 *
 * @param host the engine
 */
export async function loadViewed(host: Host): Promise<IdsBySource> {
  return seenOf(await host.storeGet(STORE_KEYS.viewed))
}
