import type { StackItem } from '../../types/index.js'
import { itemOf } from './item-of.js'
import { stackReleaseOf } from './stack-release-of.js'

/**
 * A stored value as a StackItem, or undefined when it is not an item with a release.
 *
 * @param value one stored stack item
 */
export function stackItemOf(value: unknown): StackItem | undefined {
  const item = itemOf(value)
  const release = stackReleaseOf((value as { release?: unknown } | undefined)?.release)

  return item === undefined || release === undefined ? undefined : { ...item, release }
}
