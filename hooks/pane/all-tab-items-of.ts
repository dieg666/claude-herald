import type { Item, ItemsBySource, Source } from '../../types/index.js'
import { newsListOf } from '../band/news-list-of.js'
import { isPaneSource } from './is-pane-source.js'

/**
 * What the pane's All tab lists: the news list (see `newsListOf`) of the sources in the pane (enabled and not hidden from it) and the stack, ordered as the band orders it at the default size (two flagged packages lead whatever the band's size), with the items read kept in place instead of left out (the pane draws them dim).
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
  return newsListOf(sources.filter(isPaneSource), items, stack)
}
