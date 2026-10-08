import type { Item } from '../../types/index.js'
import { combinedItemOf } from './combined-item-of.js'
import { hasText } from './has-text.js'
import { isLinkIdentified } from './is-link-identified.js'
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
 * Folds an item whose id came from its link into the one item with an identifier of its own at the same address, within a source: a story that a source's second address lists without a guid stays one item. It keeps the stored id when exactly one of the group is stored, else the identified item's; entries that carry identifiers of their own never fold, however many share an address, and nothing folds when there are two or more of them.
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
      const group = groups.get(key)

      if (group === undefined) {
        groups.set(key, [item])
      } else {
        group.push(item)
      }
    }
  }

  const folded = new Map<string, Item>()
  const dropped = new Set<string>()

  for (const members of groups.values()) {
    const identified = members.filter(item => !isLinkIdentified(item))
    const [owner] = identified

    if (identified.length === 1 && owner !== undefined && members.length > 1) {
      const stored = members.filter(item => position.has(item.id))
      const [first, ...rest] = bestFirst(members, listed)
      const id = stored.length === 1 ? (stored[0] ?? owner).id : owner.id

      if (first !== undefined) {
        folded.set(members[0]?.id ?? id, combinedItemOf(id, [first, ...rest]))

        for (const member of members.slice(1)) {
          dropped.add(member.id)
        }
      }
    }
  }

  return items.flatMap(item => (dropped.has(item.id) ? [] : [folded.get(item.id) ?? item]))
}

/**
 * Merges a fetch into kept items: one per id (the incoming copy, keeping a known date and text), an entry identified only by its link folded into the entry with an identifier of its own at the same address, dated newest first, then undated in incoming-then-kept order, so the cap drops undated items first; with nothing incoming it only folds the kept ones.
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
