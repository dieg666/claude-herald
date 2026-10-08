import type { Item, ItemsBySource, Source } from '../../types/index.js'
import { bandItemsOf } from '../band/band-items-of.js'

/**
 * What the pane's All tab lists: the band's list in the band's order, built by the same function, with the items read kept in place instead of left out (the pane draws them dim).
 *
 * @param sources every source, in order
 * @param items the kept items by source id, newest first
 * @param stack the stack items shown, newest first
 */
export function allTabItemsOf(
  sources: readonly Source[],
  items: Readonly<ItemsBySource>,
  stack: readonly Item[] = [],
): Item[] {
  return bandItemsOf(sources, items, stack)
}
