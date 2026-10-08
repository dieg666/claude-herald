// Assumes a flex row wraps greedily: an item goes on the current row while it and one gap fit.
/**
 * How many rows a wrapping row of items takes, each item put on the current row while it fits and on a new one when it does not.
 *
 * @param widths the cells each item takes, margins included
 * @param columns the cells a row may take
 * @param gap the cells between two items of a row
 */
export function wrappedRowsOf(widths: readonly number[], columns: number, gap = 2): number {
  let rows = 1
  let used = 0

  for (const width of widths) {
    if (used > 0 && used + gap + width > columns) {
      rows += 1
      used = width
    } else {
      used = used === 0 ? width : used + gap + width
    }
  }

  return rows
}
