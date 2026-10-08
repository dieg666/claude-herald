import type { SummaryEntry, SummaryKind } from '../../types/index.js'
import { SUMMARY_PROMPT_VERSION } from '../summaries/summary-prompt-version.js'

/**
 * The cached text for an item in a language and kind written by a version of the prompts, or undefined.
 *
 * @param entries the cache
 * @param itemId the item
 * @param lang the resolved summary language
 * @param kind short or long
 * @param version the version of the prompts, the current one by default
 */
export function summaryOf(
  entries: readonly SummaryEntry[],
  itemId: string,
  lang: string,
  kind: SummaryKind,
  version: number = SUMMARY_PROMPT_VERSION,
): string | undefined {
  return entries.find(
    entry =>
      entry.itemId === itemId &&
      entry.lang === lang &&
      entry.kind === kind &&
      entry.version === version,
  )?.text
}
