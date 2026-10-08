import type { IdsBySource } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { SEEN_PER_SOURCE } from './seen-per-source.js'
import { seenOf } from './seen-of.js'

/**
 * Adds ids to a source's list under a per-source store key (newest first, capped at `SEEN_PER_SOURCE`), reading the store right before writing; nothing is written when every id is already at the head of the list.
 *
 * @param host the engine
 * @param key the store key, one of ids by source id
 * @param sourceId the source
 * @param ids the ids to add, newest first
 * @returns every source's ids as stored now
 */
export async function addSourceIds(
  host: Host,
  key: string,
  sourceId: string,
  ids: readonly string[],
): Promise<IdsBySource> {
  const stored = seenOf(await host.storeGet(key))
  const before = stored[sourceId]
  const merged = [...new Set([...ids, ...(before ?? [])])].slice(0, SEEN_PER_SOURCE)

  if (before !== undefined && merged.join('\n') === before.join('\n')) {
    return stored
  }

  const next = { ...stored, [sourceId]: merged }

  await host.storeSet(key, next)

  return next
}
