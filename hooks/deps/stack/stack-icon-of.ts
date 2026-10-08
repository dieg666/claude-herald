import type { StackRelease } from '../../../types/index.js'

/**
 * The glyph drawn before a stack item: ⚠ for a breaking or security release, 📦 for any other.
 *
 * @param release the release
 */
export function stackIconOf(release: Pick<StackRelease, 'breaking' | 'security'>): string {
  return release.breaking || release.security ? '⚠' : '📦'
}
