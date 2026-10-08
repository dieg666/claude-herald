import type { Ecosystem, StackItem, StackRelease } from '../../../types/index.js'

/**
 * One followed package as the pane's stack tab lists it: its releases shown, newest first, and the highest level among them.
 */
export type StackPackage = {
  /** `<ecosystem>:<name>`. */
  readonly key: string
  readonly ecosystem: Ecosystem
  readonly name: string
  /** The newest release shown, the one the package's row names and acts on. */
  readonly newest: StackItem
  /** Every release shown, newest first, `newest` among them. */
  readonly releases: readonly StackItem[]
  /** The highest level among the releases: major, then minor, then patch, then unknown. */
  readonly level: StackRelease['level']
}
