import type { StackItem } from '../../../types/index.js'
import type { StackPackage } from './stack-package.js'

/**
 * The oldest shown release of a package that carries each flag, the one that brought it; a flag no release carries is absent.
 *
 * @param pkg the package
 */
export function packageFlagsOf(pkg: StackPackage): {
  readonly security?: StackItem
  readonly breaking?: StackItem
} {
  const oldestFirst = [...pkg.releases].reverse()
  const security = oldestFirst.find(item => item.release.security)
  const breaking = oldestFirst.find(item => item.release.breaking)

  return {
    ...(security === undefined ? {} : { security }),
    ...(breaking === undefined ? {} : { breaking }),
  }
}
