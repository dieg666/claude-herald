import type { StackItem } from '../../../types/index.js'
import { isFlaggedRelease } from './is-flagged-release.js'

/**
 * Whether a stack item is drawn with ⚠: its release is breaking or security, or, on a package's row in the band, another release of the package is.
 *
 * @param item the stack item
 */
export function isFlaggedStackItem(item: StackItem): boolean {
  return (
    isFlaggedRelease(item.release) ||
    item.rollup?.breakingIn !== undefined ||
    item.rollup?.securityIn !== undefined
  )
}
