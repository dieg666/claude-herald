import type { DepsToastLevel, StackRelease } from '../../../types/index.js'

/**
 * Whether a release passes a show or toast level: `all` passes everything, `off` nothing; past `all` a pre-release never passes, and a breaking or security release always does; `minor+` adds every level but patch (`unknown` included), `major+breaking+security` adds major.
 *
 * @param release the release's level and flags
 * @param level the level to pass
 */
export function isAtLevel(
  release: Pick<StackRelease, 'level' | 'isPrerelease' | 'breaking' | 'security'>,
  level: DepsToastLevel,
): boolean {
  if (level === 'all' || level === 'off') {
    return level === 'all'
  }

  if (release.isPrerelease) {
    return false
  }

  if (release.breaking || release.security) {
    return true
  }

  switch (level) {
    case 'minor+':
      return release.level !== 'patch'
    case 'major+breaking+security':
      // A 0.x minor bump is level major already, so it passes here too.
      return release.level === 'major'
    case 'breaking+security':
      return false
  }
}
