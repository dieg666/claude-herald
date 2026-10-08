import { displayWidthOf } from './display-width-of.js'
import { fitColumns } from './fit-columns.js'
import { SOURCE_GAP_COLUMNS } from './source-gap-columns.js'

/**
 * A label cut to `columns` cells with `…`, and the spaces after it that fill the column and its gap, so the headline that follows starts in the same column whatever the label.
 *
 * @param label one line, empty for none
 * @param columns the cells the label may take
 */
export function sourceColumnOf(
  label: string,
  columns: number,
): { readonly source: string; readonly sourceGap: string } {
  const source = fitColumns(label, columns)

  return {
    source,
    sourceGap: ' '.repeat(columns - displayWidthOf(source) + SOURCE_GAP_COLUMNS),
  }
}
