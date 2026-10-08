import type { BandRow } from '../band/band-row.js'

/**
 * One item as the pane draws it: the band's row plus the item's short date when it has one, and on the stack tab the ecosystem heading drawn above the first row of each group.
 */
export type PaneRow = BandRow & {
  readonly date?: string
  readonly heading?: string
}
