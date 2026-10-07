import type { DepFeed } from '../../types/index.js'
import { depFeedOf } from './dep-feed-of.js'
import { isRecord } from './is-record.js'

/**
 * The stored feed mappings by `<ecosystem>:<name>`, entries that are not one dropped; empty when the value is not an object.
 *
 * @param value what the store holds under `depFeeds`
 */
export function depFeedsOf(value: unknown): Record<string, DepFeed> {
  if (!isRecord(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, entry]) => {
      const feed = depFeedOf(entry)

      return feed === undefined ? [] : [[key, feed]]
    }),
  )
}
