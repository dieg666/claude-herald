import type { ItemsBySource } from '../../types/index.js'
import { isRecord } from './is-record.js'
import { itemsOf } from './items-of.js'

/**
 * The stored items by source id, each list cleaned of entries that are not an item.
 *
 * @param value what the store holds under `items`
 */
export function itemsBySourceOf(value: unknown): ItemsBySource {
  return Object.fromEntries(
    Object.entries(isRecord(value) ? value : {}).map(([sourceId, list]) => [
      sourceId,
      itemsOf(list),
    ]),
  )
}
