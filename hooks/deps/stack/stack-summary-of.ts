import { packageFlagsOf } from './package-flags-of.js'
import type { StackPackage } from './stack-package.js'

/**
 * The line under the stack tab's heading: `5 packages behind · 1 security · 1 breaking`, the counts that are zero left out; empty for no package.
 *
 * @param packages the packages shown at the project's level
 */
export function stackSummaryOf(packages: readonly StackPackage[]): string {
  if (packages.length === 0) {
    return ''
  }

  const flags = packages.map(packageFlagsOf)
  const security = flags.filter(entry => entry.security !== undefined).length
  const breaking = flags.filter(entry => entry.breaking !== undefined).length

  return [
    `${packages.length} ${packages.length === 1 ? 'package' : 'packages'} behind`,
    ...(security === 0 ? [] : [`${security} security`]),
    ...(breaking === 0 ? [] : [`${breaking} breaking`]),
  ].join(' · ')
}
