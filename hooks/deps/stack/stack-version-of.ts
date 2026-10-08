import type { StackItem } from '../../../types/index.js'
import { collapsedTextOf } from '../../page/collapsed-text-of.js'

/**
 * A release as one line names it: its version, else its title.
 *
 * @param item the stack item
 */
export function stackVersionOf(item: StackItem): string {
  return collapsedTextOf(item.release.version ?? item.title).trim()
}
