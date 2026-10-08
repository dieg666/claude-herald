import type { BandSpan } from '../band/band-span.js'

/**
 * The window of at most `size` items the pane shows over a list of `total`, around the selected index; the selection is given and returned relative to the list and the window.
 *
 * @param selected the selected index in the list, already inside it
 * @param total how many items there are
 * @param size how many items fit
 */
export function paneSpanOf(selected: number, total: number, size: number): BandSpan {
  const room = Math.max(1, Math.floor(size))
  const start = Math.max(0, Math.min(selected - Math.floor(room / 2), total - room))
  const count = Math.max(0, Math.min(room, total - start))

  return { start, count, selected: selected - start }
}
