import type { StackItem } from '../../../types/index.js'
import type { StackPackage } from './stack-package.js'
import type { StackRow } from './stack-row.js'

/**
 * The stack tab's rows: one per package, each expanded package followed by a row per release shown, newest first.
 *
 * @param packages the packages listed, in order
 * @param expanded the keys of the packages expanded
 */
export function stackRowsOf(
  packages: readonly StackPackage[],
  expanded: readonly string[],
): StackRow[] {
  const open = new Set(expanded)

  return packages.flatMap(pkg => [
    { kind: 'package' as const, pkg },
    ...(open.has(pkg.key)
      ? pkg.releases.map((item: StackItem) => ({ kind: 'release' as const, pkg, item }))
      : []),
  ])
}
