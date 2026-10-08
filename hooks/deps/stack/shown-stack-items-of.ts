import type { StackItem, StackState } from '../../../types/index.js'
import { isAtLevel } from './is-at-level.js'

/**
 * The stack items the band and the pane show: those at the project's show level, none while the stack is off or before the project is known.
 *
 * @param stack the stack as in state
 */
export function shownStackItemsOf(stack: StackState): StackItem[] {
  if (stack.root === null || !stack.settings.isEnabled) {
    return []
  }

  return stack.items.filter(item => isAtLevel(item.release, stack.settings.showLevel))
}
