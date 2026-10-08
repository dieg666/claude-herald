import type { IdsBySource, Item, ItemsBySource, Source } from '../../types/index.js'
import { timeOf } from '../items/time-of.js'

/**
 * What the band pages through: every enabled source's items and the stack items shown in one list, newest first, undated items after the dated ones in source order, stack items last; items read are left out while any unread one remains, and all are kept once every one is read.
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
      .flatMap(source => (Object.hasOwn(items, source.id) ? (items[source.id] ?? []) : [])),
    ...stack,
  ]
  const isRead = (item: Item) =>
    Object.hasOwn(read, item.sourceId) && read[item.sourceId]?.includes(item.id) === true
  const unread = all.filter(item => !isRead(item))

  return (unread.length > 0 ? unread : all)
    .map((item, index) => ({ item, index, time: timeOf(item.publishedAt) }))
    .sort((a, b) => (a.time === b.time ? a.index - b.index : b.time - a.time))
    .map(({ item }) => item)
}
