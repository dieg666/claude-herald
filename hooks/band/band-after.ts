import type { BandState } from '../../types/index.js'
import { BAND_PAGE_SIZE } from './band-page-size.js'
import type { BandMove } from './band-move.js'
import { bandSpanOf } from './band-span-of.js'
import { lastPageStartOf } from './last-page-start-of.js'

/**
 * The band after a move over a list of `total` items: pages wrap at both ends; the timer's turn does nothing while paused or when one page holds every item; the offset and selection come back inside the list first.
 *
 * @param band the band now
 * @param move what happened
 * @param total how many items there are
 * @param size how many items a page holds
 */
export function bandAfter(
  band: BandState,
  move: BandMove,
  total: number,
  size = BAND_PAGE_SIZE,
): BandState {
  const { start, count, selected } = bandSpanOf(band, total, size)
  const shown = Math.max(1, count)
  const following = start + size >= total ? 0 : start + size
  const preceding = start === 0 ? lastPageStartOf(total, size) : start - size

  switch (move) {
    case 'next':
      return { offset: following, selected: 0, isPaused: true }
    case 'prev':
      return { offset: preceding, selected: 0, isPaused: true }
    case 'rotate':
      return band.isPaused || total <= size
        ? { offset: start, selected, isPaused: band.isPaused }
        : { offset: following, selected: 0, isPaused: false }
    case 'auto':
      return { offset: start, selected, isPaused: !band.isPaused }
    case 'up':
      return { offset: start, selected: (selected + shown - 1) % shown, isPaused: true }
    case 'down':
      return { offset: start, selected: (selected + 1) % shown, isPaused: true }
  }
}
