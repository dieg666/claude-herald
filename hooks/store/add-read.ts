import type { IdsBySource } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { addSourceIds } from './add-source-ids.js'

/**
 * Records items of one source as read, capped like seen ids, reading the store right before writing.
 *
 * @param host the engine
 * @param sourceId the source
 * @param ids the items read
 * @returns every source's read ids as stored now
 */
export function addRead(
  host: Host,
  sourceId: string,
  ids: readonly string[],
): Promise<IdsBySource> {
  return addSourceIds(host, STORE_KEYS.read, sourceId, ids)
}
