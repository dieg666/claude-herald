import type { BandRow } from './band-row.js'

/**
 * Everything the full band draws, worked out from state: the header's position text (a range joined by an en dash), whether rotation is paused, the rows, whether each row takes a second line for its summary, and whether the selected item is saved.
 */
export type BandModel = {
  readonly range: string
  readonly isPaused: boolean
  readonly rows: readonly BandRow[]
  /** True while automatic summaries are on: every row draws a summary line, a placeholder or an empty line under its headline; false, every row is one line. */
  readonly hasSummaries: boolean
  readonly isSelectedSaved: boolean
}
