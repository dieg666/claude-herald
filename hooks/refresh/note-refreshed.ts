import type { Host } from '../host/host.js'
import { saveRefreshedAt } from '../store/save-refreshed-at.js'
import { messageOf } from './message-of.js'

/**
 * Records in the store that some sources refreshed cleanly at `at`, and returns the times to keep in state: those stored, other sessions' included, with these; a store failure is logged and leaves just these. Never throws.
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
  const fresh = Object.fromEntries(sourceIds.map(id => [id, at]))

  try {
    return { ...(await saveRefreshedAt(host, sourceIds, at)), ...fresh }
  } catch (error) {
    host.debug(`herald: could not record the refresh time: ${messageOf(error)}`)

    return fresh
  }
}
