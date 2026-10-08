import { ECOSYSTEM_LABELS } from './ecosystem-labels.js'
import type { StackPackage } from './stack-package.js'

/**
 * Whether a package matches the pane's filter: every word of it, ignoring case, is in the package name, the ecosystem, the package's level or a flag of any of its releases shown; a blank filter matches everything.
 *
 * @param pkg the package
 * @param filter the text typed
 */
export function matchesStackFilter(pkg: StackPackage, filter: string): boolean {
  const has = (flag: 'isPrerelease' | 'breaking' | 'security') =>
    pkg.releases.some(item => item.release[flag])
  const haystack = [
    pkg.name,
    pkg.ecosystem,
    ECOSYSTEM_LABELS[pkg.ecosystem],
    pkg.level,
    has('isPrerelease') ? 'pre-release' : '',
    has('breaking') ? 'breaking' : '',
    has('security') ? 'security' : '',
  ]
    .join(' ')
    .toLowerCase()

  return filter
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .every(word => haystack.includes(word))
}
