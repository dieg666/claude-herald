import type { Item } from '../../types/index.js'
import { ITEMS_PER_SOURCE } from './items-per-source.js'

/**
 * The milliseconds of an item's date, or null when it has none that parses.
 *
 * @param item the item
 */
function timeOf(item: Item): number | null {
  const time = item.publishedAt === undefined ? NaN : Date.parse(item.publishedAt)

  return Number.isNaN(time) ? null : time
}

/**
 * Merges a fetch into kept items: one per id (the incoming copy, keeping a known date), dated newest first, then undated in incoming-then-kept order, so the cap drops undated items first.
 *
 * @param existing the items kept so far
 * @param incoming the items just fetched, in feed order
 * @param cap how many to keep
 */
export function mergeItems(
  existing: readonly Item[],
  incoming: readonly Item[],
  cap: number = ITEMS_PER_SOURCE,
): Item[] {
  const kept = new Map(existing.map(item => [item.id, item]))
  const byId = new Map<string, Item>()

  for (const item of incoming) {
    if (!byId.has(item.id)) {
      const publishedAt = item.publishedAt ?? kept.get(item.id)?.publishedAt

      byId.set(item.id, publishedAt === undefined ? item : { ...item, publishedAt })
    }
  }

  for (const item of existing) {
    if (!byId.has(item.id)) {
      byId.set(item.id, item)
    }
  }

  const timed = [...byId.values()].map(item => ({ item, time: timeOf(item) }))

  const dated = timed
    .filter(entry => entry.time !== null)
    .sort((a, b) => (b.time ?? 0) - (a.time ?? 0))

  const undated = timed.filter(entry => entry.time === null)

  return [...dated, ...undated].slice(0, Math.max(0, Math.floor(cap))).map(entry => entry.item)
}
