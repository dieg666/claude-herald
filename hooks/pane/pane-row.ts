import type { BandRow } from '../band/band-row.js'

/**
 * One item as the pane draws it: the band's row plus the item's short date when it has one.
 */
export type PaneRow = BandRow & {
  readonly date?: string
}
