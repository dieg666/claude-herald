import type { BandState, Item } from '../../types/index.js'
import { BAND_PAGE_SIZE } from './band-page-size.js'
import type { BandPage } from './band-page.js'
import { bandSpanOf } from './band-span-of.js'

/**
 * The page a band state shows over the whole list.
 *
 * @param band the band state
 * @param items every item the band pages through
 * @param size how many items a page holds
 */
export function bandPageOf(
  band: BandState,
  items: readonly Item[],
  size = BAND_PAGE_SIZE,
): BandPage {
  const span = bandSpanOf(band, items.length, size)

  return {
    items: items.slice(span.start, span.start + span.count),
    span,
    total: items.length,
    isPaused: band.isPaused,
  }
}
