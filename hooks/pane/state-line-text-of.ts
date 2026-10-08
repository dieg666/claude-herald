import { displayWidthOf } from '../band/display-width-of.js'
import { fitColumns } from '../band/fit-columns.js'
import type { PaneStateLine } from './pane-state-line.js'

/**
 * The fewest cells the text keeps before its tail when the line is cut; narrower than that, the whole line is cut instead.
 */
const TEXT_MIN_COLUMNS = 20

/**
 * A state line fitted to `columns` cells: whole when it fits, else the text cut so the tail stays whole, else the whole line cut.
 *
 * @param line the state line
 * @param columns the cells it may take
 */
export function stateLineTextOf(line: PaneStateLine, columns: number): string {
  const tail = line.tail ?? ''
  const whole = `${line.text}${tail}`
  const room = columns - displayWidthOf(tail)

  if (displayWidthOf(whole) <= columns || tail === '' || room < TEXT_MIN_COLUMNS) {
    return fitColumns(whole, columns)
  }

  return `${fitColumns(line.text, room)}${tail}`
}
