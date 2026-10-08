import type { SummaryEntry } from '../../types/index.js'
import { SUMMARY_CACHE_MAX } from './summary-cache-max.js'

/**
 * The cache with an entry added as the newest, replacing one of the same item, language and kind whatever version wrote it, the oldest evicted past the cap.
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
  const others = entries.filter(
    other =>
      other.itemId !== entry.itemId || other.lang !== entry.lang || other.kind !== entry.kind,
  )
  const room = Math.max(0, Math.floor(max))

  return room === 0 ? [] : [...others, entry].slice(-room)
}
