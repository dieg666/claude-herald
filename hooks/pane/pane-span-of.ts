import type { BandSpan } from '../band/band-span.js'
import { paneRoomOf } from './pane-room-of.js'

/**
 * The window of at most `size` items the pane shows over a list of `total`, around the selected index (a size that is not a number taken as `PANE_FIRST_WINDOW`); the selection is given and returned relative to the list and the window.
 *
 * @param selected the selected index in the list, already inside it
 * @param total how many items there are
 * @param size how many items fit
 */
export function paneSpanOf(selected: number, total: number, size: number): BandSpan {
  const room = paneRoomOf(size)
  const start = Math.max(0, Math.min(selected - Math.floor(room / 2), total - room))
  const count = Math.max(0, Math.min(room, total - start))

  return { start, count, selected: selected - start }
}
