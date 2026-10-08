import type { StackRelease } from '../../../types/index.js'
import { isFlaggedRelease } from './is-flagged-release.js'

/**
 * The glyph drawn before a stack item: ⚠ for a breaking or security release (`isFlaggedRelease`), 📦 for any other.
 *
 * @param release the release
 */
export function stackIconOf(release: Pick<StackRelease, 'breaking' | 'security'>): string {
  return isFlaggedRelease(release) ? '⚠' : '📦'
}
