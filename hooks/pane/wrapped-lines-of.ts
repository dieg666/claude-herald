import { displayWidthOf } from '../band/display-width-of.js'

/**
 * The lines a row of labels takes when it wraps at `columns` cells, two cells between labels, as a wrapping row Box with a two-cell column gap lays them out.
 *
 * @param labels the labels as drawn
 * @param columns the cells across
 */
export function wrappedLinesOf(labels: readonly string[], columns: number): number {
  let lines = 1
  let used = 0

  for (const label of labels) {
    const width = displayWidthOf(label)

    if (used > 0 && used + 2 + width > columns) {
      lines += 1
      used = width
    } else {
      used += (used > 0 ? 2 : 0) + width
    }
  }

  return lines
}
