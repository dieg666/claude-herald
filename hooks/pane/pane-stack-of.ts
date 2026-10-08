import type { StackState } from '../../types/index.js'
import { shownStackItemsOf } from '../deps/stack/shown-stack-items-of.js'
import type { PaneStack } from './pane-stack.js'

/**
 * What the pane's stack tab draws from, or undefined when the pane has no stack tab: before the project is known, or while its stack is off.
 *
 * @param stack the stack as in state
 */
export function paneStackOf(stack: StackState): PaneStack | undefined {
  return stack.root === null || !stack.settings.isEnabled
    ? undefined
    : { items: shownStackItemsOf(stack), filter: stack.filter, expanded: stack.expanded ?? [] }
}
