import type { StackItem } from '../../../types/index.js'
import { packageFlagsOf } from './package-flags-of.js'
import type { StackPackage } from './stack-package.js'
import { stackVersionOf } from './stack-version-of.js'

/**
 * The item that stands for a package in the band and the All tab: its target release (the one its row in the stack tab names and acts on), with a `rollup` of the package's other releases shown when there are any, so the row can say that one of them is breaking or security.
 *
 * @param pkg the package
 */
export function stackPackageItemOf(pkg: StackPackage): StackItem {
  if (pkg.releases.length < 2) {
    return pkg.target
  }

  const flags = packageFlagsOf(pkg)
  const versionIn = (item: StackItem | undefined) =>
    item === undefined || item.id === pkg.target.id ? undefined : stackVersionOf(item)
  const breakingIn = versionIn(flags.breaking)
  const securityIn = versionIn(flags.security)

  return {
    ...pkg.target,
    rollup: {
      releases: pkg.releases.length,
      ...(breakingIn === undefined ? {} : { breakingIn }),
      ...(securityIn === undefined ? {} : { securityIn }),
    },
  }
}
