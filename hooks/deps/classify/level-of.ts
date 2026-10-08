import type { ReleaseLevel } from './release-level.js'
import type { Version } from './version.js'

/**
 * How far a newer release is from the version in use: the first release part that differs (missing parts are 0) is major, minor or patch; a change in the epoch is major, and a change in qualifiers only (`2.0.0-rc.1` to `2.0.0`) is patch.
 *
 * @param current the version in use
 * @param release a newer version
 */
export function levelOf(current: Version, release: Version): Exclude<ReleaseLevel, 'unknown'> {
  if (current.epoch !== release.epoch) {
    return 'major'
  }

  const length = Math.max(current.release.length, release.release.length)
  let changed = -1

  for (let index = 0; index < length && changed === -1; index += 1) {
    if ((current.release[index] ?? 0) !== (release.release[index] ?? 0)) {
      changed = index
    }
  }

  if (changed === -1) {
    return 'patch'
  }

  // Below 1.0 the first non-zero part is the compatibility boundary, as caret ranges treat it, so 0.3 to 0.4 is major.
  const leading = current.release.findIndex(part => part !== 0)
  const boundary = leading === -1 ? 2 : Math.min(leading, 2)

  if (changed <= boundary) {
    return 'major'
  }

  return changed === 1 ? 'minor' : 'patch'
}
