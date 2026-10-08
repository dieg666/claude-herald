import type { Item, ItemsBySource, Source } from '../../types/index.js'
import { timeOf } from '../items/time-of.js'

/**
 * What the band pages through: every enabled source's items and the stack items shown in one list, newest first, undated items after the dated ones in source order, stack items last.
 *
 * @param sources every source, in order
 * @param items the kept items by source id, newest first
 * @param stack the stack items shown, newest first
 */
export function bandItemsOf(
  sources: readonly Source[],
  items: Readonly<ItemsBySource>,
  stack: readonly Item[] = [],
): Item[] {
  const all = [
    ...sources
      .filter(source => source.isEnabled)
      .flatMap(source => (Object.hasOwn(items, source.id) ? (items[source.id] ?? []) : [])),
    ...stack,
  ]

  return all
    .map((item, index) => ({ item, index, time: timeOf(item.publishedAt) }))
    .sort((a, b) => (a.time === b.time ? a.index - b.index : b.time - a.time))
    .map(({ item }) => item)
}
