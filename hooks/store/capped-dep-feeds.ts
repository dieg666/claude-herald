import type { DepFeed } from '../../types/index.js'
import { DEP_FEEDS_MAX } from './dep-feeds-max.js'

/**
 * Every override plus the most recently resolved other mappings, at most the cap of them.
 *
 * @param feeds the mappings by `<ecosystem>:<name>`
 * @param max how many looked-up mappings to keep
 */
export function cappedDepFeeds(
  feeds: Readonly<Record<string, DepFeed>>,
  max: number = DEP_FEEDS_MAX,
): Record<string, DepFeed> {
  const entries = Object.entries(feeds)
  const overrides = entries.filter(([, feed]) => feed.isOverride === true)
  const looked = entries
    .filter(([, feed]) => feed.isOverride !== true)
    .sort(([, a], [, b]) => b.resolvedAt - a.resolvedAt)
    .slice(0, Math.max(0, max))

  return Object.fromEntries([...overrides, ...looked])
}
