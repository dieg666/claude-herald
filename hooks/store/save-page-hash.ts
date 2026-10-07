import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { pageHashesOf } from './page-hashes-of.js'

/**
 * Records a page source's content hash, reading the store right before writing.
 *
 * @param host the engine
 * @param sourceId the page source
 * @param hash the hash of the content just extracted
 */
export async function savePageHash(host: Host, sourceId: string, hash: string): Promise<void> {
  const hashes = pageHashesOf(await host.storeGet(STORE_KEYS.pageHashes))

  await host.storeSet(STORE_KEYS.pageHashes, { ...hashes, [sourceId]: hash })
}
