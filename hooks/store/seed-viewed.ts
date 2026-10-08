import type { IdsBySource } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { addSourceIds } from './add-source-ids.js'
import { seenOf } from './seen-of.js'

/**
 * Gives a source its first viewed ids, the baseline its new count starts from, when it has none and there is at least one id; reads the store right before writing.
 *
 * @param host the engine
 * @param sourceId the source
 * @param ids the items that are not new, newest first
 * @returns every source's viewed ids as stored now, or undefined when nothing was written
 */
export async function seedViewed(
  host: Host,
  sourceId: string,
  ids: readonly string[],
): Promise<IdsBySource | undefined> {
  if (ids.length === 0 || Object.hasOwn(seenOf(await host.storeGet(STORE_KEYS.viewed)), sourceId)) {
    return undefined
  }

  return addSourceIds(host, STORE_KEYS.viewed, sourceId, ids)
}
