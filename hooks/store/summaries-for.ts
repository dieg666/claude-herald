import type { SummaryEntry, SummaryKind } from '../../types/index.js'
import { SUMMARY_PROMPT_VERSION } from '../summaries/summary-prompt-version.js'

/**
 * The cached texts of one language and kind by item id, written by a version of the prompts, what `$.state` mirrors.
 *
 * @param entries the cache
 * @param lang the resolved summary language
 * @param kind short or long
 * @param version the version of the prompts, the current one by default
 */
export function summariesFor(
  entries: readonly SummaryEntry[],
  lang: string,
  kind: SummaryKind = 'short',
  version: number = SUMMARY_PROMPT_VERSION,
): Record<string, string> {
  return Object.fromEntries(
    entries
      .filter(entry => entry.lang === lang && entry.kind === kind && entry.version === version)
      .map(entry => [entry.itemId, entry.text]),
  )
}
