import { clipText } from '../feed/text/clip-text.js'
import { collapsedTextOf } from '../page/collapsed-text-of.js'

/**
 * A feed title as one short line: control characters and line breaks gone, whitespace collapsed, cut at a word to fit a toast.
 *
 * @param title the item's title, untrusted
 */
export function titleLineOf(title: string): string {
  return clipText(collapsedTextOf(title).trim(), 80)
}
