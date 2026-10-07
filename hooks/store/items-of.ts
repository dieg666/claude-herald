import type { Item } from '../../types/index.js'
import { itemOf } from './item-of.js'

/**
 * A stored list as Items, dropping entries that are not one; empty when it is not a list.
 *
 * @param value one stored list
 */
export function itemsOf(value: unknown): Item[] {
  return Array.isArray(value)
    ? value.flatMap(entry => {
        const item = itemOf(entry)

        return item === undefined ? [] : [item]
      })
    : []
}
