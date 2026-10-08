import type { Item } from '../../types/index.js'
import { combinedItemOf } from './combined-item-of.js'
import { hasText } from './has-text.js'
import { ITEMS_PER_SOURCE } from './items-per-source.js'
import { normalizedUrlOf } from './normalized-url-of.js'

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
 * The items of one source that share an address: the copies the feed lists now first, then the kept ones with the most text.
 *
 * @param members the items of one address
 * @param listed the ids the fetch lists
 */
function bestFirst(members: readonly Item[], listed: ReadonlySet<string>): Item[] {
  const rank = (item: Item) => (listed.has(item.id) ? 2 : hasText(item) ? 1 : 0)
  const length = (item: Item) => (rank(item) === 1 ? item.text.length : 0)

  return members
    .map((item, index) => ({ item, index }))
    .sort(
      (a, b) => rank(b.item) - rank(a.item) || length(b.item) - length(a.item) || a.index - b.index,
    )
    .map(entry => entry.item)
}

/**
 * The kept item that is oldest by date; on a tie the one with text of its own, then the one stored last (the list is newest first).
 *
 * @param members the kept items of one address, at least one
 * @param position where each is in the kept list
 */
function oldestOf(members: readonly Item[], position: ReadonlyMap<string, number>): Item {
  const [first, ...rest] = members

  return rest.reduce((oldest, item) => {
    const a = timeOf(oldest)
    const b = timeOf(item)

    if (a !== null && b !== null && a !== b) {
      return a < b ? oldest : item
    }

    if (hasText(oldest) !== hasText(item)) {
      return hasText(item) ? item : oldest
    }

    return (position.get(item.id) ?? 0) >= (position.get(oldest.id) ?? 0) ? item : oldest
  }, first as Item)
}

/**
 * Folds items of one source that share an address into the oldest kept one, so a story a feed lists under a new id (its second address, a changed guid) stays one item under the id the user's seen, saved and summaries use; items the fetch lists under their own ids, all of them, stay apart, and an item without an http(s) address is left alone.
 *
 * @param items the items, one per id
 * @param listed the ids the fetch lists
 * @param position where each kept item is in the kept list
 */
function foldedByAddress(
  items: readonly Item[],
  listed: ReadonlySet<string>,
  position: ReadonlyMap<string, number>,
): Item[] {
  const groups = new Map<string, Item[]>()

  for (const item of items) {
    const address = normalizedUrlOf(item.url)

    if (address !== undefined) {
      const key = `${item.sourceId}\n${address}`

      groups.set(key, [...(groups.get(key) ?? []), item])
    }
  }

  const folded = new Map<string, Item>()
  const emitted = new Set<string>()

  for (const members of groups.values()) {
    const kept = members.filter(item => position.has(item.id))
    const [first, ...rest] = bestFirst(members, listed)
    const isListedAll = members.every(item => listed.has(item.id))

    if (members.length > 1 && kept.length > 0 && !isListedAll && first !== undefined) {
      const { id } = oldestOf(kept, position)

      folded.set(members[0]?.id ?? id, combinedItemOf(id, [first, ...rest]))

      for (const member of members.slice(1)) {
        emitted.add(member.id)
      }
    }
  }

  return items.flatMap(item => {
    if (emitted.has(item.id)) {
      return []
    }

    return [folded.get(item.id) ?? item]
  })
}

/**
 * Merges a fetch into kept items: one per id (the incoming copy, keeping a known date and text), one per address within a source (the oldest kept id wins), dated newest first, then undated in incoming-then-kept order, so the cap drops undated items first; with nothing incoming it only folds the kept duplicates.
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
  const position = new Map(existing.map((item, index) => [item.id, index]))
  const byId = new Map<string, Item>()

  for (const item of incoming) {
    if (!byId.has(item.id)) {
      const old = kept.get(item.id)

      byId.set(item.id, old === undefined ? item : combinedItemOf(item.id, [item, old]))
    }
  }

  for (const item of existing) {
    if (!byId.has(item.id)) {
      byId.set(item.id, item)
    }
  }

  const listed = new Set(incoming.map(item => item.id))
  const folded = foldedByAddress([...byId.values()], listed, position)
  const timed = folded.map(item => ({ item, time: timeOf(item) }))

  const dated = timed
    .filter(entry => entry.time !== null)
    .sort((a, b) => (b.time ?? 0) - (a.time ?? 0))

  const undated = timed.filter(entry => entry.time === null)

  return [...dated, ...undated].slice(0, Math.max(0, Math.floor(cap))).map(entry => entry.item)
}
