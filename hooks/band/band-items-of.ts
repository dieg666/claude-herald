import type { IdsBySource, Item, ItemsBySource, Source } from '../../types/index.js'
import { BAND_PAGE_SIZE } from './band-page-size.js'
import { isBandSource } from './is-band-source.js'
import { newsListOf } from './news-list-of.js'

/**
 * What the band pages through: the news list (see `newsListOf`) of the sources on the band (enabled and not hidden from it) and the stack, the items read left out while any unread one remains, one fewer flagged package leading than the full band shows.
 *
 * @param sources every source, in order
 * @param items the kept items by source id, newest first
 * @param stack the stack items shown, newest first, of every release of a package
 * @param read the read item ids by source id
 * @param bandSize how many items the full band shows at once
 */
export function bandItemsOf(
  sources: readonly Source[],
  items: Readonly<ItemsBySource>,
  stack: readonly Item[] = [],
  read: Readonly<IdsBySource> = {},
  bandSize = BAND_PAGE_SIZE,
): Item[] {
  return newsListOf(sources.filter(isBandSource), items, stack, read, bandSize)
}
