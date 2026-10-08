import type { BandState } from '../../types/index.js'
import { BAND_PAGE_SIZE } from './band-page-size.js'
import type { BandSpan } from './band-span.js'
import { pageStartOf } from './page-start-of.js'

/**
 * The page a band state shows over a list of `total` items, the offset and selection brought back inside it (a list that shrank, a bad value).
 *
 * @param band the band state
 * @param total how many items there are
 */
export function bandSpanOf(band: BandState, total: number): BandSpan {
  const start = pageStartOf(band.offset, total)
  const count = Math.max(0, Math.min(BAND_PAGE_SIZE, total - start))
  const selected = Number.isInteger(band.selected) && band.selected > 0 ? band.selected : 0

  return { start, count, selected: Math.min(selected, Math.max(0, count - 1)) }
}
