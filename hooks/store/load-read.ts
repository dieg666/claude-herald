import type { IdsBySource } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { seenOf } from './seen-of.js'

/**
 * The read item ids by source id; empty when none was ever read.
 *
 * @param host the engine
 */
export async function loadRead(host: Host): Promise<IdsBySource> {
  return seenOf(await host.storeGet(STORE_KEYS.read))
}
