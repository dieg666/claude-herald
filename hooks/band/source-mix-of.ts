import type { Item } from '../../types/index.js'
import { timeOf } from '../items/time-of.js'
import { BAND_PAGE_SIZE } from './band-page-size.js'

/** How many of the latest picks a source stays out of while another has items, so no page repeats it. */
const GUARD = BAND_PAGE_SIZE - 1

/** An item with its time and its place in the list given. */
type Entry = { readonly item: Item; readonly time: number; readonly index: number }

/**
 * Whether entry `a` goes before entry `b` of another source: newer first, then by source id, then by item id.
 *
 * @param a one entry
 * @param b the other
 */
function isBefore(a: Entry, b: Entry): boolean {
  if (a.time !== b.time) {
    return a.time > b.time
  }

  if (a.item.sourceId !== b.item.sourceId) {
    return a.item.sourceId < b.item.sourceId
  }

  return a.item.id < b.item.id
}

/**
 * Items in rounds over their sources: each round takes every source's newest remaining item (ties in the order given), the newest of them first, ties by source id then item id; a source taken in the last `BAND_PAGE_SIZE - 1` places, those of the items placed before these included, waits while another source has items, so no page repeats a source while others remain.
 *
 * @param items the items, in any order
 * @param before the source ids of the items placed right before these, in order
 */
export function sourceMixOf(items: readonly Item[], before: readonly string[] = []): Item[] {
  const queues = new Map<string, Entry[]>()

  items.forEach((item, index) => {
    const queue = queues.get(item.sourceId) ?? []

    queue.push({ item, time: timeOf(item.publishedAt), index })
    queues.set(item.sourceId, queue)
  })

  for (const queue of queues.values()) {
    queue.sort((a, b) => (a.time === b.time ? a.index - b.index : b.time - a.time))
  }

  const mixed: Item[] = []
  const taken = new Set<string>()
  const recent = before.slice(Math.max(0, before.length - GUARD))
  const rankOf = (sourceId: string) =>
    (recent.includes(sourceId) ? 2 : 0) + (taken.has(sourceId) ? 1 : 0)

  for (;;) {
    const heads = [...queues.values()].flatMap(queue => (queue[0] === undefined ? [] : [queue[0]]))

    if (heads.length === 0) {
      return mixed
    }

    if (heads.every(head => taken.has(head.item.sourceId))) {
      taken.clear()
    }

    const next = heads.reduce((best, head) => {
      const rank = rankOf(head.item.sourceId)
      const bestRank = rankOf(best.item.sourceId)

      return rank < bestRank || (rank === bestRank && isBefore(head, best)) ? head : best
    })
    const sourceId = next.item.sourceId

    queues.get(sourceId)?.shift()
    mixed.push(next.item)
    taken.add(sourceId)
    recent.push(sourceId)

    if (recent.length > GUARD) {
      recent.shift()
    }
  }
}
