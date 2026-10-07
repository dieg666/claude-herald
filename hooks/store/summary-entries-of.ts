import type { SummaryEntry } from '../../types/index.js'
import { isRecord } from './is-record.js'

/**
 * The stored summary cache, oldest first, dropping entries that are not a summary.
 *
 * @param value what the store holds under `summaries`
 */
export function summaryEntriesOf(value: unknown): SummaryEntry[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap(entry =>
    isRecord(entry) &&
    typeof entry.itemId === 'string' &&
    typeof entry.lang === 'string' &&
    (entry.kind === 'short' || entry.kind === 'long') &&
    typeof entry.text === 'string'
      ? [{ itemId: entry.itemId, lang: entry.lang, kind: entry.kind, text: entry.text }]
      : [],
  )
}
