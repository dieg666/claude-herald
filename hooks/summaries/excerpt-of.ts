import { isLinkLabel } from '../items/is-link-label.js'
import { collapsedTextOf } from '../page/collapsed-text-of.js'
import { cutTo } from '../page/cut-to.js'
import { SUMMARY_LIMITS } from './summary-limits.js'

const LABELLED_URL =
  /(?<![\p{L}\p{N}])(?:article|comments?|discussion|story|source|original|permalink|link|thread)\s+url\s*:\s*\S+/giu

const COUNTER =
  /(?<![\p{L}\p{N}])#?\s*(?:points?|comments?|votes?|upvotes?)\s*:\s*\d[\d,.]*[km]?(?=\s|$)/giu

const BARE_URL = /(?<![\p{L}\p{N}])https?:\/\/\S+/giu

const EDGE_SEPARATORS = /^[\s|·•\-–—:;,]+|[\s|·•\-–—:;,]+$/g

const LETTERS_AND_DIGITS = /[\p{L}\p{N}]/gu

/**
 * The text of an item worth sending to the model: link-and-counter boilerplate (labelled URLs, point and comment counts, bare addresses) removed, cut to the limit; empty when what is left is trivial, only repeats the title or is only a link label.
 *
 * @param text the item's excerpt, one line
 * @param title the item's title
 */
export function excerptOf(text: string, title: string): string {
  const kept = collapsedTextOf(
    text.replace(LABELLED_URL, ' ').replace(COUNTER, ' ').replace(BARE_URL, ' '),
  )
    .replace(EDGE_SEPARATORS, '')
    .trim()

  const meaningful = kept.match(LETTERS_AND_DIGITS)?.length ?? 0
  const repeatsTitle = collapsedTextOf(title).toLowerCase().includes(kept.toLowerCase())

  if (meaningful < SUMMARY_LIMITS.minExcerptChars || repeatsTitle || isLinkLabel(kept)) {
    return ''
  }

  return cutTo(kept, SUMMARY_LIMITS.itemTextChars)
}
