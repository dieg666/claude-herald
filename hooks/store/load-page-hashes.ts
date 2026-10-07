import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { pageHashesOf } from './page-hashes-of.js'

/**
 * The content hash of each page source's last extraction, by source id.
 *
 * @param host the engine
 */
export async function loadPageHashes(host: Host): Promise<Record<string, string>> {
  return pageHashesOf(await host.storeGet(STORE_KEYS.pageHashes))
}
