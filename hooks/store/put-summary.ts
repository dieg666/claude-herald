import type { SummaryEntry } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { summaryEntriesOf } from './summary-entries-of.js'
import { withSummary } from './with-summary.js'

/**
 * Caches a summary as the newest entry, reading the store right before writing.
 *
 * @param host the engine
 * @param entry the summary
 * @returns the cache as stored now, oldest first
 */
export async function putSummary(host: Host, entry: SummaryEntry): Promise<SummaryEntry[]> {
  const next = withSummary(summaryEntriesOf(await host.storeGet(STORE_KEYS.summaries)), entry)

  await host.storeSet(STORE_KEYS.summaries, next)

  return next
}
