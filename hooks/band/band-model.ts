import type { BandRow } from './band-row.js'

/**
 * Everything the band draws, worked out from state: the header's position text, whether rotation is paused, the rows, and whether the selected item is saved.
 */
export type BandModel = {
  readonly range: string
  readonly isPaused: boolean
  readonly rows: readonly BandRow[]
  readonly isSelectedSaved: boolean
}
