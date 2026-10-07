import type { Source } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'

/**
 * Saves the whole source list.
 *
 * @param host the engine
 * @param sources every source, in order
 */
export async function saveSources(host: Host, sources: readonly Source[]): Promise<void> {
  await host.storeSet(STORE_KEYS.sources, sources)
}
