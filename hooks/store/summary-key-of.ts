import type { SummaryKind } from '../../types/index.js'
import { SUMMARY_PROMPT_VERSION } from '../summaries/summary-prompt-version.js'

/**
 * A key part with `%` and `|` percent-encoded, so the joined key cannot collide.
 *
 * @param part one part of the key
 */
function escapeOf(part: string): string {
  return part.replace(/%/g, '%25').replace(/\|/g, '%7C')
}

/**
 * The cache key of a summary: `<itemId>|<lang>|<kind>|<version>`, a `|` or `%` inside a part percent-encoded.
 *
 * @param itemId the item
 * @param lang the resolved summary language
 * @param kind short or long
 * @param version the version of the prompts, the current one by default
 */
export function summaryKeyOf(
  itemId: string,
  lang: string,
  kind: SummaryKind,
  version: number = SUMMARY_PROMPT_VERSION,
): string {
  return [itemId, lang, kind, String(version)].map(escapeOf).join('|')
}
