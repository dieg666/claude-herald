import type { StackItem } from '../../types/index.js'

/**
 * What the pane's stack tab draws from: the stack items shown at the project's level, newest first, the filter typed and the packages expanded.
 */
export type PaneStack = {
  readonly items: readonly StackItem[]
  readonly filter: string
  /** The keys of the packages whose releases are listed under them, `<ecosystem>:<name>`. */
  readonly expanded: readonly string[]
}
