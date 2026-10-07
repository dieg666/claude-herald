import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { seenOf } from './seen-of.js'

/**
 * The seen item ids by source id; a source without an entry has never loaded.
 *
 * @param host the engine
 */
export async function loadSeen(host: Host): Promise<Record<string, string[]>> {
  return seenOf(await host.storeGet(STORE_KEYS.seen))
}
