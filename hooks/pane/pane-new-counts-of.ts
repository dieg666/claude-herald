import type { IdsBySource, ItemsBySource } from '../../types/index.js'

/**
 * How many of each source's kept items arrived since its tab was last shown, by source id: the items not among its viewed ids; a source with no viewed ids yet counts none.
 *
 * @param items the kept items by source id
 * @param viewed the viewed ids by source id
 */
export function paneNewCountsOf(
  items: Readonly<ItemsBySource>,
  viewed: Readonly<IdsBySource>,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(items).flatMap(([sourceId, list]) => {
      const ids = Object.hasOwn(viewed, sourceId) ? viewed[sourceId] : undefined

      if (ids === undefined) {
        return []
      }

      const known = new Set(ids)
      const count = list.filter(item => !known.has(item.id)).length

      return count > 0 ? [[sourceId, count]] : []
    }),
  )
}
