import type { Item, StackItem } from '../../../types/index.js'
import { STACK_TAB } from '../../names/stack-tab.js'

/**
 * Whether an item is a release of the stack, with its release.
 *
 * @param item any item
 */
export function isStackItem(item: Item): item is StackItem {
  return (
    item.sourceId === STACK_TAB &&
    typeof (item as Partial<StackItem>).release === 'object' &&
    (item as Partial<StackItem>).release !== null
  )
}
