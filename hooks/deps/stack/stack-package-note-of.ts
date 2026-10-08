import { collapsedTextOf } from '../../page/collapsed-text-of.js'
import { packageFlagsOf } from './package-flags-of.js'
import type { StackPackage } from './stack-package.js'
import { stackVersionOf } from './stack-version-of.js'

/**
 * What a package's row says after its level: each flag with the release that brought it unless that is the newest (`security`, `breaking in 30.0.0`), `pre-release` when the newest is one, and `5 releases` when more than one is shown.
 *
 * @param pkg the package
 */
export function stackPackageNoteOf(pkg: StackPackage): string {
  const flags = packageFlagsOf(pkg)
  const named = (flag: 'security' | 'breaking') => {
    const item = flags[flag]

    if (item === undefined) {
      return []
    }

    return item.id === pkg.newest.id ? [flag] : [`${flag} in ${stackVersionOf(item)}`]
  }

  return collapsedTextOf(
    [
      ...named('security'),
      ...named('breaking'),
      ...(pkg.newest.release.isPrerelease ? ['pre-release'] : []),
      ...(pkg.releases.length > 1 ? [`${pkg.releases.length} releases`] : []),
    ].join(' · '),
  ).trim()
}
