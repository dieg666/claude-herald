import type { StackItem } from '../../../types/index.js'

/**
 * What one stack refresh did: skipped (not started, or another in flight), the packages whose feeds it read, the releases new to it, and the toast it showed.
 */
export type StackRun = {
  readonly isSkipped: boolean
  /** `<ecosystem>:<name>` of each package whose release feed was read. */
  readonly checked: readonly string[]
  readonly newReleases: readonly StackItem[]
  readonly toast?: string
}
