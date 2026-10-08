import type { IdsBySource, Item, ItemsBySource, Source } from '../../types/index.js'
import { isReleaseFeed } from '../items/is-release-feed.js'
import { timeOf } from '../items/time-of.js'
import { newestItemOf } from './newest-item-of.js'
import { sourceMixOf } from './source-mix-of.js'

/**
 * What the band pages through: every enabled source's items, only the newest of a release feed's, and the stack items shown in one list; items read are left out first while any unread one remains (all kept once every one is read), then the dated ones are mixed by source (the stack counts as one) so no page repeats a source while others have items, and the undated ones follow in source order, stack items last.
 *
 * @param sources every source, in order
 * @param items the kept items by source id, newest first
 * @param stack the stack items shown, newest first
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
    ...stack,
  ]
  const isRead = (item: Item) =>
    Object.hasOwn(read, item.sourceId) && read[item.sourceId]?.includes(item.id) === true
  const unread = all.filter(item => !isRead(item))
  const kept = unread.length > 0 ? unread : all
  const isDated = (item: Item) => timeOf(item.publishedAt) !== Number.NEGATIVE_INFINITY

  return [...sourceMixOf(kept.filter(isDated)), ...kept.filter(item => !isDated(item))]
}
