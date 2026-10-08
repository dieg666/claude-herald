import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { isRecord } from './is-record.js'

/**
 * Drops the entries of some sources from the per-source store values (items, seen, read and viewed ids, page hashes), each read right before it is written and left alone when it holds none of them.
 *
 * @param host the engine
 * @param sourceIds the sources removed
 */
export async function forgetSources(host: Host, sourceIds: readonly string[]): Promise<void> {
  const ids = new Set(sourceIds)

  for (const key of [
    STORE_KEYS.items,
    STORE_KEYS.seen,
    STORE_KEYS.read,
    STORE_KEYS.viewed,
    STORE_KEYS.pageHashes,
  ]) {
    const value = await host.storeGet(key)

    if (isRecord(value) && Object.keys(value).some(id => ids.has(id))) {
      await host.storeSet(
        key,
        Object.fromEntries(Object.entries(value).filter(([id]) => !ids.has(id))),
      )
    }
  }
}
