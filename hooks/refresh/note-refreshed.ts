import type { Host } from '../host/host.js'
import { loadSources } from '../store/load-sources.js'
import { saveRefreshedAt } from '../store/save-refreshed-at.js'
import { messageOf } from './message-of.js'

/**
 * Records in the store that some sources refreshed cleanly at `at`, those removed meanwhile left out, and returns the times to keep in state: those stored, other sessions' included, with these; a store failure is logged and leaves just these. Never throws.
 *
 * @param host the engine
 * @param sourceIds the sources that refreshed cleanly
 * @param at when, in milliseconds since the epoch
 */
export async function noteRefreshed(
  host: Host,
  sourceIds: readonly string[],
  at: number,
): Promise<Record<string, number>> {
  let fresh = Object.fromEntries(sourceIds.map(id => [id, at]))

  try {
    const current = new Set((await loadSources(host)).map(source => source.id))
    const kept = sourceIds.filter(id => current.has(id))

    fresh = Object.fromEntries(kept.map(id => [id, at]))

    return { ...(await saveRefreshedAt(host, kept, at)), ...fresh }
  } catch (error) {
    host.debug(`herald: could not record the refresh time: ${messageOf(error)}`)

    return fresh
  }
}
