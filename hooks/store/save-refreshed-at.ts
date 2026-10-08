import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { refreshedAtOf } from './refreshed-at-of.js'

/**
 * Records that some sources refreshed cleanly at `at`, reading the store right before writing; writes nothing for no source.
 *
 * @param host the engine
 * @param sourceIds the sources that refreshed cleanly
 * @param at when, in milliseconds since the epoch
 * @returns the times as stored now, by source id
 */
export async function saveRefreshedAt(
  host: Host,
  sourceIds: readonly string[],
  at: number,
): Promise<Record<string, number>> {
  const stored = refreshedAtOf(await host.storeGet(STORE_KEYS.refreshedAt))

  if (sourceIds.length === 0) {
    return stored
  }

  const next = { ...stored, ...Object.fromEntries(sourceIds.map(id => [id, at])) }

  await host.storeSet(STORE_KEYS.refreshedAt, next)

  return next
}
