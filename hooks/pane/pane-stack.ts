import type { DepsSettings, StackItem, StackProgress } from '../../types/index.js'

/**
 * What the pane's stack tab draws from: the stack items shown at the project's level, newest first, the filter typed and the packages expanded; and, for what an empty tab says, the project's settings, how many kept releases its level hides and how far following it got.
 */
export type PaneStack = {
  readonly items: readonly StackItem[]
  readonly filter: string
  /** The keys of the packages whose releases are listed under them, `<ecosystem>:<name>`. */
  readonly expanded: readonly string[]
  /** The project's stack settings; absent reads as on, at its default level. */
  readonly settings?: Pick<DepsSettings, 'isEnabled' | 'includeDev' | 'showLevel'>
  /** How many kept releases the project's show level hides. */
  readonly hidden?: number
  /** How far detection and the release lookups got; absent before the first. */
  readonly progress?: StackProgress
}
