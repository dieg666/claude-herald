import type { Item } from '../../types/index.js'
import { timeOf } from '../items/time-of.js'

/**
 * The newest of a source's items by date, the first given on a tie; undated ones lose to any dated one, and the first given is taken when none is dated.
 *
 * @param items the source's items, in stored order
 */
export function newestItemOf(items: readonly Item[]): Item | undefined {
  return items.reduce<Item | undefined>(
    (newest, item) =>
      newest === undefined || timeOf(item.publishedAt) > timeOf(newest.publishedAt) ? item : newest,
    undefined,
  )
}
