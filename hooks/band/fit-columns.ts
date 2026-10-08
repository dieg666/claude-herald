import { charWidthOf } from './char-width-of.js'
import { displayWidthOf } from './display-width-of.js'

/**
 * A line cut to fit `columns` cells, an ellipsis marking the cut; wide characters count two cells; empty when nothing fits.
 *
 * @param text one line, control characters already removed
 * @param columns the cells it may take
 */
export function fitColumns(text: string, columns: number): string {
  if (displayWidthOf(text) <= columns) {
    return text
  }

  if (columns < 1) {
    return ''
  }

  let width = 0
  let kept = ''

  for (const char of text) {
    const next = width + charWidthOf(char)

    if (next > columns - 1) {
      break
    }

    width = next
    kept += char
  }

  return `${kept.trimEnd()}…`
}
