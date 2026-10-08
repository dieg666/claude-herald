import type { StackState } from '../../types/index.js'
import { shownStackItemsOf } from '../deps/stack/shown-stack-items-of.js'
import type { PaneStack } from './pane-stack.js'

/**
 * What the pane's stack tab draws from, or undefined before the project is known, when the pane has no stack tab; while the stack is off the tab lists nothing and says so.
 *
 * @param stack the stack as in state
 */
export function paneStackOf(stack: StackState): PaneStack | undefined {
  if (stack.root === null) {
    return undefined
  }

  const items = shownStackItemsOf(stack)
  const { isEnabled, includeDev, showLevel } = stack.settings

  return {
    items,
    filter: stack.filter,
    expanded: stack.expanded ?? [],
    settings: { isEnabled, includeDev, showLevel },
    hidden: isEnabled ? stack.items.length - items.length : 0,
    ...(stack.progress === undefined ? {} : { progress: stack.progress }),
  }
}
