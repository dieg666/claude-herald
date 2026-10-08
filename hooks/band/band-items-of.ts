import type { Item, ItemsBySource, Source } from '../../types/index.js'

/**
 * The time an item sorts by, undated (or unparsable) items last.
 *
 * @param item the item
 */
function timeOf(item: Item): number {
  const time = item.publishedAt === undefined ? Number.NaN : Date.parse(item.publishedAt)

  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time
}

/**
 * What the band pages through: every enabled source's items in one list, newest first, undated items after the dated ones in source order.
 *
 * @param sources every source, in order
 * @param items the kept items by source id, newest first
 */
export function bandItemsOf(sources: readonly Source[], items: Readonly<ItemsBySource>): Item[] {
  const all = sources
    .filter(source => source.isEnabled)
    .flatMap(source => (Object.hasOwn(items, source.id) ? (items[source.id] ?? []) : []))

  return all
    .map((item, index) => ({ item, index, time: timeOf(item) }))
    .sort((a, b) => (a.time === b.time ? a.index - b.index : b.time - a.time))
    .map(({ item }) => item)
}
