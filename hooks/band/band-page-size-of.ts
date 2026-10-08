import { BAND_PAGE_SIZE } from './band-page-size.js'
import { isCompactBand } from './is-compact-band.js'

/**
 * How many items a page of the band holds at that width: one while it is compact, else `BAND_PAGE_SIZE`.
 *
 * @param columns the cells the band's tree may take
 * @param total how many items there are
 */
export function bandPageSizeOf(columns: number, total: number): number {
  return isCompactBand(columns, total) ? 1 : BAND_PAGE_SIZE
}
