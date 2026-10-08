import type { StackItem } from '../../../types/index.js'
import { ECOSYSTEMS } from '../../store/ecosystems.js'
import { matchesStackFilter } from './matches-stack-filter.js'

/**
 * What the pane's stack tab lists: the shown items matching the filter, grouped by ecosystem in a fixed order, each group in the order given.
 *
 * @param items the stack items shown, newest first
 * @param filter the text typed
 */
export function stackTabItemsOf(items: readonly StackItem[], filter: string): StackItem[] {
  return items
    .filter(item => matchesStackFilter(item, filter))
    .map((item, index) => ({ item, index, group: ECOSYSTEMS.indexOf(item.release.ecosystem) }))
    .sort((a, b) => a.group - b.group || a.index - b.index)
    .map(({ item }) => item)
}
