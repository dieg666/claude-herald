import type { IdsBySource } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { addSourceIds } from './add-source-ids.js'

/**
 * Records the items a source tab shows as viewed, capped like seen ids, reading the store right before writing.
 *
 * @param host the engine
 * @param sourceId the source
 * @param ids the tab's items, newest first
 * @returns every source's viewed ids as stored now
 */
export function addViewed(
  host: Host,
  sourceId: string,
  ids: readonly string[],
): Promise<IdsBySource> {
  return addSourceIds(host, STORE_KEYS.viewed, sourceId, ids)
}
