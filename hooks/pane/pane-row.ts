import type { BandRow } from '../band/band-row.js'
import type { PaneCell } from './pane-cell.js'

/**
 * One item as the pane draws it: the band's row without its source column (its one-line summary unused), the source's name on the saved tab, plus the item's short date when it has one, the selected item's summary lines, and on the stack tab the ecosystem heading drawn above the first row of each group, the columns after the title and whether it is a release listed under its package; and whether a news item was read.
 */
export type PaneRow = Omit<BandRow, 'source' | 'sourceGap' | 'isRelease'> & {
  /** On the saved tab, the source's name cut to the room left after the headline; absent elsewhere, when the source is gone or there is no room. */
  readonly source?: string
  readonly date?: string
  /** The selected item's summary wrapped to the pane's width, at most three lines; absent on every other row and while pending. */
  readonly summaryLines?: readonly string[]
  readonly heading?: string
  /** The stack tab's columns after the title; a row that has them takes one line, without a summary. */
  readonly cells?: readonly PaneCell[]
  /** Whether the row is a release listed under its package, drawn indented. */
  readonly isIndented?: boolean
  /** Present, true, when the item was opened or copied for Claude: its headline is drawn dim unless selected. */
  readonly isRead?: true
}
