import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { SEEN_PER_SOURCE } from './seen-per-source.js'
import { seenOf } from './seen-of.js'

/**
 * Adds ids to a source's seen list (newest first, capped), reading the store right before writing; creates the entry on a first load even with no ids.
 *
 * @param host the engine
 * @param sourceId the source
 * @param ids the ids just seen
 * @returns the source's seen ids as stored now
 */
export async function markSeen(
  host: Host,
  sourceId: string,
  ids: readonly string[],
): Promise<string[]> {
  const seen = seenOf(await host.storeGet(STORE_KEYS.seen))
  const merged = [...new Set([...ids, ...(seen[sourceId] ?? [])])].slice(0, SEEN_PER_SOURCE)

  await host.storeSet(STORE_KEYS.seen, { ...seen, [sourceId]: merged })

  return merged
}
