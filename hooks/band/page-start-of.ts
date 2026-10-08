import { BAND_PAGE_SIZE } from './band-page-size.js'
import { lastPageStartOf } from './last-page-start-of.js'

/**
 * The first index of the page an offset falls in, the last page when the list shrank below it; 0 for an empty list or a bad offset.
 *
 * @param offset the stored offset
 * @param total how many items there are
 */
export function pageStartOf(offset: number, total: number): number {
  if (!Number.isInteger(offset) || offset <= 0) {
    return 0
  }

  return Math.min(offset - (offset % BAND_PAGE_SIZE), lastPageStartOf(total))
}
