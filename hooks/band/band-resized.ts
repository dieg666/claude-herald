import type { BandState, Item } from '../../types/index.js'

/**
 * The band after its size changed: the item it had selected (by offset and selection over the list before, the last one when they point past it) selected again where the list after puts it, on the page of the new size that holds it; the nearest place when it is gone; pause kept.
 *
 * @param band the band now
 * @param before what the band paged through at the old size
 * @param after what it pages through at the new size
 * @param size how many items a page holds now
 */
export function bandResized(
  band: BandState,
  before: readonly Item[],
  after: readonly Item[],
  size: number,
): BandState {
  const offset = Number.isInteger(band.offset) && band.offset > 0 ? band.offset : 0
  const selected = Number.isInteger(band.selected) && band.selected > 0 ? band.selected : 0
  const was = Math.min(offset + selected, before.length - 1)
  const item = was < 0 ? undefined : before[was]
  const found = item === undefined ? -1 : after.findIndex(other => other.id === item.id)
  const index = found >= 0 ? found : Math.max(0, Math.min(was, after.length - 1))

  return { offset: index - (index % size), selected: index % size, isPaused: band.isPaused }
}
