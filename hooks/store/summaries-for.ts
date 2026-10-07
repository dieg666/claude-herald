import type { SummaryEntry, SummaryKind } from '../../types/index.js'

/**
 * The cached texts of one language and kind by item id, what `$.state` mirrors.
 *
 * @param entries the cache
 * @param lang the resolved summary language
 * @param kind short or long
 */
export function summariesFor(
  entries: readonly SummaryEntry[],
  lang: string,
  kind: SummaryKind = 'short',
): Record<string, string> {
  return Object.fromEntries(
    entries
      .filter(entry => entry.lang === lang && entry.kind === kind)
      .map(entry => [entry.itemId, entry.text]),
  )
}
