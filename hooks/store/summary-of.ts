import type { SummaryEntry, SummaryKind } from '../../types/index.js'

/**
 * The cached text for an item in a language and kind, or undefined.
 *
 * @param entries the cache
 * @param itemId the item
 * @param lang the resolved summary language
 * @param kind short or long
 */
export function summaryOf(
  entries: readonly SummaryEntry[],
  itemId: string,
  lang: string,
  kind: SummaryKind,
): string | undefined {
  return entries.find(
    entry => entry.itemId === itemId && entry.lang === lang && entry.kind === kind,
  )?.text
}
