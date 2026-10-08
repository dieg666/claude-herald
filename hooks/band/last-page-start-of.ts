import { BAND_PAGE_SIZE } from './band-page-size.js'

/**
 * The first index of the last page of a list; 0 for an empty one.
 *
 * @param total how many items there are
 * @param size how many items a page holds
 */
export function lastPageStartOf(total: number, size = BAND_PAGE_SIZE): number {
  return total <= 0 ? 0 : Math.floor((total - 1) / size) * size
}
