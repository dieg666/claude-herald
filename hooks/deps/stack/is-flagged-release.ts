import type { StackRelease } from '../../../types/index.js'

/**
 * Whether a release is breaking or fixes a security issue, the releases drawn with ⚠.
 *
 * @param release the release
 */
export function isFlaggedRelease(release: Pick<StackRelease, 'breaking' | 'security'>): boolean {
  return release.breaking || release.security
}
