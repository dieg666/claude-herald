import type { StackItem } from '../../../types/index.js'
import { isFlaggedStackItem } from './is-flagged-stack-item.js'

/**
 * The glyph drawn before a stack item in the band and the All tab: ⚠ when `isFlaggedStackItem`, else 📦.
 *
 * @param item the stack item
 */
export function stackItemIconOf(item: StackItem): string {
  return isFlaggedStackItem(item) ? '⚠' : '📦'
}
