import { clipText } from '../feed/text/clip-text.js'
import { collapsedTextOf } from '../page/collapsed-text-of.js'
import { SUMMARY_LIMITS } from './summary-limits.js'

/**
 * A reply as one line: its lines joined, bullets and wrapping quotes dropped, whitespace collapsed, cut at a word to fit; undefined when nothing is left.
 *
 * @param reply the model's text
 */
export function shortSummaryOf(reply: string): string | undefined {
  const joined = reply
    .split(/\r\n|\r|\n/)
    .map(line => line.replace(/^\s*(?:[-*•·]|\d+[.)])\s+/, '').trim())
    .filter(line => line !== '')
    .join(' ')

  const line = collapsedTextOf(joined)
    .trim()
    .replace(/^["'“”«»]+|["'“”«»]+$/g, '')
    .trim()

  return line === '' ? undefined : clipText(line, SUMMARY_LIMITS.shortChars)
}
