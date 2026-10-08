import type { IdsBySource, ItemsBySource, Source } from '../../types/index.js'
import { allTabItemsOf } from './all-tab-items-of.js'
import { paneNewCountsOf } from './pane-new-counts-of.js'

/**
 * How many of the items the All tab lists are new, by the rule of a source tab's count (not among its source's viewed ids, none for a source with no viewed ids yet); the stack's releases never count.
 *
 * @param sources every source, in order
 * @param items the kept items by source id, newest first
 * @param viewed the viewed ids by source id
 */
export function allTabNewCountOf(
  sources: readonly Source[],
  items: Readonly<ItemsBySource>,
  viewed: Readonly<IdsBySource>,
): number {
  const listed: Record<string, ItemsBySource[string]> = {}

  for (const item of allTabItemsOf(sources, items)) {
    listed[item.sourceId] = [...(listed[item.sourceId] ?? []), item]
  }

  return Object.values(paneNewCountsOf(listed, viewed)).reduce((sum, count) => sum + count, 0)
}
