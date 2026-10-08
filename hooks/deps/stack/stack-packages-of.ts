import type { StackItem } from '../../../types/index.js'
import { depFeedKeyOf } from '../resolve/dep-feed-key-of.js'
import { LEVEL_RANKS } from './level-ranks.js'
import type { StackPackage } from './stack-package.js'
import { targetReleaseOf } from './target-release-of.js'

/**
 * Stack items gathered per package, in the order each package first appears, each package's releases in the order given, with the release its row targets.
 *
 * @param items the stack items, newest first
 */
export function stackPackagesOf(items: readonly StackItem[]): StackPackage[] {
  const groups = new Map<string, StackItem[]>()

  for (const item of items) {
    const key = depFeedKeyOf(item.release)

    groups.set(key, [...(groups.get(key) ?? []), item])
  }

  return [...groups].flatMap(([key, releases]) => {
    const [newest, ...older] = releases

    if (newest === undefined) {
      return []
    }

    const level = releases
      .map(release => release.release.level)
      .reduce((best, next) => (LEVEL_RANKS[next] < LEVEL_RANKS[best] ? next : best))

    return [
      {
        key,
        ecosystem: newest.release.ecosystem,
        name: newest.release.name,
        target: targetReleaseOf([newest, ...older]),
        releases,
        level,
      },
    ]
  })
}
