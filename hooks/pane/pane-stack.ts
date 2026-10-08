import type { StackItem } from '../../types/index.js'

/**
 * What the pane's stack tab draws from: the stack items shown at the project's level, newest first, and the filter typed.
 */
export type PaneStack = {
  readonly items: readonly StackItem[]
  readonly filter: string
}
