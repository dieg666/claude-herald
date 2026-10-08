import type { StackPackage } from './stack-package.js'

/**
 * Whether any release shown of a package is breaking or fixes a security issue.
 *
 * @param pkg the package
 */
export function isFlaggedPackage(pkg: StackPackage): boolean {
  return pkg.releases.some(item => item.release.breaking || item.release.security)
}
