import type { IdsBySource, Item, ItemsBySource, Source } from '../../types/index.js'
import { isFlaggedStackItem } from '../deps/stack/is-flagged-stack-item.js'
import { isStackItem } from '../deps/stack/is-stack-item.js'
import { stackPackageItemsOf } from '../deps/stack/stack-package-items-of.js'
import { isReleaseFeed } from '../items/is-release-feed.js'
import { timeOf } from '../items/time-of.js'
import { BAND_PAGE_SIZE } from './band-page-size.js'
import { newestItemOf } from './newest-item-of.js'
import { sourceMixOf } from './source-mix-of.js'

/** How many flagged stack releases lead the band, so the first page keeps a place for another source. */
const LEAD_LIMIT = BAND_PAGE_SIZE - 1

/**
 * What the band pages through: every enabled source's items, only the newest of a release feed's, and the stack's packages, one item each (the package's target release, see `stackPackageItemsOf`), in one list; items read are left out first while any unread one remains (all kept once every one is read), then the newest `BAND_PAGE_SIZE - 1` of the stack's packages with a breaking or security release (those drawn with ⚠) lead (undated ones last), then the other dated ones, flagged releases past those included, are mixed by source (the stack counts as one) so no page repeats a source while others have items (the stack's rows that lead counted as just placed), and the undated ones follow in source order, stack items last.
 *
 * @param sources every source, in order
 * @param items the kept items by source id, newest first
 * @param stack the stack items shown, newest first, of every release of a package
 * @param read the read item ids by source id
 */
export function bandItemsOf(
  sources: readonly Source[],
  items: Readonly<ItemsBySource>,
  stack: readonly Item[] = [],
  read: Readonly<IdsBySource> = {},
): Item[] {
  const all = [
    ...sources
      .filter(source => source.isEnabled)
      .flatMap(source => {
        const own = Object.hasOwn(items, source.id) ? (items[source.id] ?? []) : []
        const newest = isReleaseFeed(source.url) ? newestItemOf(own) : undefined

        return newest === undefined ? own : [newest]
      }),
    ...stackPackageItemsOf(stack.filter(isStackItem)),
  ]
  const isRead = (item: Item) =>
    Object.hasOwn(read, item.sourceId) && read[item.sourceId]?.includes(item.id) === true
  const unread = all.filter(item => !isRead(item))
  const kept = unread.length > 0 ? unread : all
  const isFlagged = (item: Item) => isStackItem(item) && isFlaggedStackItem(item)
  const lead = kept
    .filter(isFlagged)
    .map((item, index) => ({ item, time: timeOf(item.publishedAt), index }))
    .sort((a, b) => (a.time === b.time ? a.index - b.index : b.time - a.time))
    .slice(0, LEAD_LIMIT)
    .map(entry => entry.item)
  const rest = kept.filter(item => !lead.includes(item))
  const isDated = (item: Item) => timeOf(item.publishedAt) !== Number.NEGATIVE_INFINITY
  const mixed = sourceMixOf(
    rest.filter(isDated),
    lead.map(item => item.sourceId),
  )

  return [...lead, ...mixed, ...rest.filter(item => !isDated(item))]
}
