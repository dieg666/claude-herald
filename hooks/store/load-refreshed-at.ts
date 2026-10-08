import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { refreshedAtOf } from './refreshed-at-of.js'

/**
 * When each source last refreshed cleanly, in milliseconds since the epoch, by source id; a source without an entry never has.
 *
 * @param host the engine
 */
export async function loadRefreshedAt(host: Host): Promise<Record<string, number>> {
  return refreshedAtOf(await host.storeGet(STORE_KEYS.refreshedAt))
}
