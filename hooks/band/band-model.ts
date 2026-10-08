import type { BandRow } from './band-row.js'

/**
 * Everything the band draws, worked out from state: the header's position text (a range joined by an en dash), whether rotation is paused, the rows, whether the selected item is saved, and whether the header and the actions line each take two rows.
 */
export type BandModel = {
  readonly range: string
  readonly isPaused: boolean
  readonly rows: readonly BandRow[]
  readonly isSelectedSaved: boolean
  /** The back, next and auto Buttons take a row of their own: the header at its widest does not fit. */
  readonly isHeaderSplit: boolean
  /** The actions line takes two rows (open, summarize and save, then copy, up and down): the line at its widest does not fit. */
  readonly isActionsSplit: boolean
}
