import type { StackItem } from '../../../types/index.js'
import { compareVersions } from '../classify/compare-versions.js'
import { parseVersion } from '../classify/parse-version.js'

/**
 * The release a package's row names and acts on: the highest version among the stable releases shown (a pre-release only when none is stable), the newer date first on a tie; a version that cannot be parsed ranks below any that can.
 *
 * @param releases the package's releases shown, newest first, at least one
 */
export function targetReleaseOf(releases: readonly [StackItem, ...StackItem[]]): StackItem {
  const stable = releases.filter(item => !item.release.isPrerelease)
  const [first, ...rest] = stable.length > 0 ? stable : releases
  const versionOf = (item: StackItem) =>
    item.release.version === undefined
      ? undefined
      : parseVersion(item.release.version, item.release.ecosystem)

  let best = first as StackItem
  let bestVersion = versionOf(best)

  for (const item of rest) {
    const version = versionOf(item)

    if (
      version !== undefined &&
      (bestVersion === undefined || compareVersions(version, bestVersion) > 0)
    ) {
      best = item
      bestVersion = version
    }
  }

  return best
}
