import { clipText } from '../feed/text/clip-text.js'
import { collapsedTextOf } from '../page/collapsed-text-of.js'
import { SUMMARY_LIMITS } from './summary-limits.js'

/**
 * The sentences of a text, each ending at `.`, `!`, `?` or an ideographic full stop.
 *
 * @param text one line
 */
function sentencesOf(text: string): string[] {
  return text
    .split(/(?<=[.!?。！？])\s+|(?<=[。！？])/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence !== '')
}

/**
 * Values spread over at most `count` groups, in order, the earlier groups taking any extra.
 *
 * @param values what to group
 * @param count how many groups
 */
function groupsOf(values: readonly string[], count: number): string[] {
  const size = Math.ceil(values.length / count)
  const groups: string[] = []

  for (let start = 0; start < values.length; start += size) {
    groups.push(values.slice(start, start + size).join(' '))
  }

  return groups
}

/**
 * A reply as 3-5 lines: bullets dropped and whitespace collapsed per line, a reply of fewer lines split at its sentences, more lines cut to the first five, each cut to fit; fewer than 3 only when the reply holds fewer sentences; undefined when nothing is left.
 *
 * @param reply the model's text
 */
export function longSummaryOf(reply: string): string | undefined {
  const { longMinLines, longMaxLines, longLineChars } = SUMMARY_LIMITS

  let lines = reply
    .split(/\r\n|\r|\n/)
    .map(line => collapsedTextOf(line.replace(/^\s*(?:[-*•·]|\d+[.)])\s+/, '')).trim())
    .filter(line => line !== '')

  if (lines.length < longMinLines) {
    const sentences = sentencesOf(lines.join(' '))

    lines = groupsOf(sentences, Math.min(longMaxLines, sentences.length))
  }

  const kept = lines.slice(0, longMaxLines).map(line => clipText(line, longLineChars))

  return kept.length === 0 ? undefined : kept.join('\n')
}
