import type { StackItem } from '../../../types/index.js'
import { timeOf } from '../../items/time-of.js'
import { ECOSYSTEMS } from '../../store/ecosystems.js'
import { isFlaggedPackage } from './is-flagged-package.js'
import { LEVEL_RANKS } from './level-ranks.js'
import { matchesStackFilter } from './matches-stack-filter.js'
import type { StackPackage } from './stack-package.js'
import { stackPackagesOf } from './stack-packages-of.js'

/**
 * What the pane's stack tab lists: one entry per package matching the filter, grouped by ecosystem in a fixed order; inside each group flagged packages first, then by level (major, minor, patch, unknown), then by the date of the release the row targets, newest first.
 *
 * @param items the stack items shown, newest first
 * @param filter the text typed
 */
export function stackTabPackagesOf(items: readonly StackItem[], filter: string): StackPackage[] {
  return stackPackagesOf(items)
    .filter(pkg => matchesStackFilter(pkg, filter))
    .map((pkg, index) => ({
      pkg,
      index,
      group: ECOSYSTEMS.indexOf(pkg.ecosystem),
      flagged: isFlaggedPackage(pkg) ? 0 : 1,
      level: LEVEL_RANKS[pkg.level],
      time: timeOf(pkg.target.publishedAt),
    }))
    .sort(
      (a, b) =>
        a.group - b.group ||
        a.flagged - b.flagged ||
        a.level - b.level ||
        (a.time === b.time ? 0 : b.time > a.time ? 1 : -1) ||
        a.index - b.index,
    )
    .map(({ pkg }) => pkg)
}
