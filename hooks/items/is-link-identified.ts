import type { Item } from '../../types/index.js'
import { itemIdOf } from './item-id-of.js'

/**
 * Whether an item's id came from its link, as for an entry with no guid or id, rather than from an identifier the source gave it.
 *
 * @param item the item
 */
export function isLinkIdentified(item: Pick<Item, 'id' | 'sourceId' | 'url'>): boolean {
  return itemIdOf(item.sourceId, { link: item.url }) === item.id
}
