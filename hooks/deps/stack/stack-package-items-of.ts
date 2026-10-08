import type { StackItem } from '../../../types/index.js'
import { timeOf } from '../../items/time-of.js'
import { stackPackageItemOf } from './stack-package-item-of.js'
import { stackPackagesOf } from './stack-packages-of.js'

/**
 * One item per followed package, as the band and the All tab list the stack: the package's target release (see `stackPackageItemOf`), the packages newest target first, undated ones last, in the order given on a tie.
 *
 * @param items the stack items shown, newest first
 */
export function stackPackageItemsOf(items: readonly StackItem[]): StackItem[] {
  return stackPackagesOf(items)
    .map((pkg, index) => ({
      item: stackPackageItemOf(pkg),
      index,
      time: timeOf(pkg.target.publishedAt),
    }))
    .sort((a, b) => (a.time === b.time ? a.index - b.index : b.time - a.time))
    .map(({ item }) => item)
}
