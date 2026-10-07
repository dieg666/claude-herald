import { FEED_LIMITS } from '../feed-limits.js'
import { clipText } from './clip-text.js'
import { cleanText } from './clean-text.js'
import { htmlToText } from './html-to-text.js'

/** A body as a capped one-line summary, or undefined when it holds no text. */
export function summaryOf(value: string, isHtml: boolean): string | undefined {
  const text = isHtml ? htmlToText(value) : cleanText(value.slice(0, FEED_LIMITS.htmlSourceChars))

  return text === '' ? undefined : clipText(text, FEED_LIMITS.summaryChars)
}
