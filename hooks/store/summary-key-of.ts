import type { SummaryKind } from '../../types/index.js'

/**
 * The cache key of a summary: `<itemId>|<lang>|<kind>`.
 *
 * @param itemId the item
 * @param lang the resolved summary language
 * @param kind short or long
 */
export function summaryKeyOf(itemId: string, lang: string, kind: SummaryKind): string {
  return `${itemId}|${lang}|${kind}`
}
