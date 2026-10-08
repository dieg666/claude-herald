import type { BandRow } from '../band/band-row.js'
import type { PaneCell } from './pane-cell.js'

/**
 * One item as the pane draws it: the band's row plus the item's short date when it has one, and on the stack tab the ecosystem heading drawn above the first row of each group, the columns after the title and whether it is a release listed under its package.
 */
export type PaneRow = BandRow & {
  readonly date?: string
  readonly heading?: string
  /** The stack tab's columns after the title; a row that has them takes one line, without a summary. */
  readonly cells?: readonly PaneCell[]
  /** Whether the row is a release listed under its package, drawn indented. */
  readonly isIndented?: boolean
}
