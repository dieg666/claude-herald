import { bandSizeOf } from '../store/band-size-of.js'
import { BAND_PAGE_SIZE } from './band-page-size.js'
import { isCompactBand } from './is-compact-band.js'

/**
 * How many items a page of the band holds at that width: one while it is compact, else the full band's size (`bandSizeOf`).
 *
 * @param columns the cells the band's tree may take
 * @param total how many items there are
 * @param size how many items the full band shows at once
 */
export function bandPageSizeOf(columns: number, total: number, size = BAND_PAGE_SIZE): number {
  return isCompactBand(columns, total) ? 1 : bandSizeOf(size)
}
