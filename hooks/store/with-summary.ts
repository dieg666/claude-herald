import type { SummaryEntry } from '../../types/index.js'
import { SUMMARY_CACHE_MAX } from './summary-cache-max.js'
import { summaryKeyOf } from './summary-key-of.js'

/**
 * The cache with an entry added as the newest, replacing one under the same key, the oldest evicted past the cap.
 *
 * @param entries the cache, oldest first
 * @param entry the summary to add
 * @param max how many entries to keep
 */
export function withSummary(
  entries: readonly SummaryEntry[],
  entry: SummaryEntry,
  max: number = SUMMARY_CACHE_MAX,
): SummaryEntry[] {
  const key = summaryKeyOf(entry.itemId, entry.lang, entry.kind)
  const others = entries.filter(other => summaryKeyOf(other.itemId, other.lang, other.kind) !== key)
  const room = Math.max(0, Math.floor(max))

  return room === 0 ? [] : [...others, entry].slice(-room)
}
