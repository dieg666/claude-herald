import { BAND_PAGE_SIZE } from './band-page-size.js'
import { lastPageStartOf } from './last-page-start-of.js'

/**
 * The first index of the page an offset falls in, the last page when the list shrank below it; 0 for an empty list or a bad offset.
 *
 * @param offset the stored offset
 * @param total how many items there are
 * @param size how many items a page holds
 */
export function pageStartOf(offset: number, total: number, size = BAND_PAGE_SIZE): number {
  if (!Number.isInteger(offset) || offset <= 0) {
    return 0
  }

  return Math.min(offset - (offset % size), lastPageStartOf(total, size))
}
