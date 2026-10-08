import { displayWidthOf } from './display-width-of.js'
import { fitColumns } from './fit-columns.js'
import type { HeadlineLine } from './headline-line.js'
import { SOURCE_GAP_COLUMNS } from './source-gap-columns.js'
import { SOURCE_MIN_COLUMNS } from './source-min-columns.js'

/**
 * A headline line fitted to `columns` cells: the name is cut first, down to `SOURCE_MIN_COLUMNS`, then dropped, and only then does the headline lose cells; no name means a headline alone.
 *
 * @param title the headline, one line
 * @param source the source's name, one line; undefined or empty to draw none
 * @param columns the cells the headline and the name may take together
 */
export function headlineLineOf(
  title: string,
  source: string | undefined,
  columns: number,
): HeadlineLine {
  const titleWidth = displayWidthOf(title)
  const room = columns - titleWidth - SOURCE_GAP_COLUMNS

  if (
    source === undefined ||
    source === '' ||
    room < Math.min(SOURCE_MIN_COLUMNS, displayWidthOf(source))
  ) {
    return { title: fitColumns(title, columns) }
  }

  const fitted = fitColumns(source, room)

  if (fitted === '') {
    return { title: fitColumns(title, columns) }
  }

  return {
    title,
    source: fitted,
    sourceGap: ' '.repeat(columns - titleWidth - displayWidthOf(fitted)),
  }
}
