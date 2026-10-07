import type { SummaryEntry } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { summaryEntriesOf } from './summary-entries-of.js'

/**
 * The summary cache, oldest first.
 *
 * @param host the engine
 */
export async function loadSummaries(host: Host): Promise<SummaryEntry[]> {
  return summaryEntriesOf(await host.storeGet(STORE_KEYS.summaries))
}
