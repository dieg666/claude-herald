import type { IdsBySource, Item, ItemsBySource, Source } from '../../types/index.js'
import { isFlaggedStackItem } from '../deps/stack/is-flagged-stack-item.js'
import { isStackItem } from '../deps/stack/is-stack-item.js'
import { stackPackageItemsOf } from '../deps/stack/stack-package-items-of.js'
import { isReleaseFeed } from '../items/is-release-feed.js'
import { timeOf } from '../items/time-of.js'
import { BAND_PAGE_SIZE } from './band-page-size.js'
import { newestItemOf } from './newest-item-of.js'

/** An item with its time and its place in the list given. */
type Entry = { readonly item: Item; readonly time: number; readonly index: number }

/**
 * How entry `a` sorts against entry `b`: newer first, then by source id, then in the order given.
 *
 * @param a one entry
 * @param b the other
 */
function compareEntries(a: Entry, b: Entry): number {
  if (a.time !== b.time) {
    return b.time - a.time
  }

  if (a.item.sourceId !== b.item.sourceId) {
    return a.item.sourceId < b.item.sourceId ? -1 : 1
  }

  return a.index - b.index
}

/**
 * The news list of the given sources (none filtered here) and the stack, as the band and the All tab list it: the sources' items, only the newest of a release feed's, and the stack's packages, one item each (the package's target release, see `stackPackageItemsOf`); items read are left out first while any unread one remains (all kept once every one is read); then the newest `bandSize - 1` of the stack's packages (one fewer than the full band shows, so its first page keeps a place for another source) with a breaking or security release (those drawn with ⚠) lead (undated ones last), then every other dated item newest first across sources (ties by source id, then in stored order), then the undated ones in source order, stack items last.
 *
 * @param sources the sources listed, in order
 * @param items the kept items by source id, newest first
 * @param stack the stack items shown, newest first, of every release of a package
 * @param read the read item ids by source id
 * @param bandSize how many items the full band shows at once
 */
export function newsListOf(
  sources: readonly Source[],
  items: Readonly<ItemsBySource>,
  stack: readonly Item[] = [],
  read: Readonly<IdsBySource> = {},
  bandSize = BAND_PAGE_SIZE,
): Item[] {
  const all = [
    ...sources.flatMap(source => {
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
  const entries = kept.map((item, index) => ({ item, time: timeOf(item.publishedAt), index }))
  const isFlagged = (entry: Entry) => isStackItem(entry.item) && isFlaggedStackItem(entry.item)
  const lead = entries
    .filter(isFlagged)
    .sort((a, b) => (a.time === b.time ? a.index - b.index : b.time - a.time))
    .slice(0, Math.max(0, bandSize - 1))
  const rest = entries.filter(entry => !lead.includes(entry))
  const isDated = (entry: Entry) => entry.time !== Number.NEGATIVE_INFINITY
  const dated = rest.filter(isDated).sort(compareEntries)

  return [...lead, ...dated, ...rest.filter(entry => !isDated(entry))].map(entry => entry.item)
}
