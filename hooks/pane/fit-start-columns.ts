import { charWidthOf } from '../band/char-width-of.js'
import { displayWidthOf } from '../band/display-width-of.js'

/**
 * A line cut from its start to fit `columns` cells, an ellipsis marking the cut, so a scoped name keeps its own part: `…/fontawesome-svg-core`; empty when nothing fits.
 *
 * @param text one line, control characters already removed
 * @param columns the cells it may take
 */
export function fitStartColumns(text: string, columns: number): string {
  if (displayWidthOf(text) <= columns) {
    return text
  }

  if (columns < 1) {
    return ''
  }

  let width = 0
  let kept = ''

  for (const char of [...text].reverse()) {
    const next = width + charWidthOf(char)

    if (next > columns - 1) {
      break
    }

    width = next
    kept = char + kept
  }

  return `…${kept.trimStart()}`
}
