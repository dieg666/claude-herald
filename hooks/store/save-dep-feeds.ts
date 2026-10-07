import type { DepFeed } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { cappedDepFeeds } from './capped-dep-feeds.js'
import { depFeedsOf } from './dep-feeds-of.js'

/**
 * Whether a lookup's result may replace what the store holds now: an override set or cleared meanwhile wins, and only a repository override takes a checked feed.
 *
 * @param stored the mapping stored now
 * @param next the lookup's result
 */
function isReplaceable(stored: DepFeed | undefined, next: DepFeed): boolean {
  if (next.isOverride !== true) {
    return stored?.isOverride !== true
  }

  return stored?.isOverride === true && stored.repo !== undefined && stored.repo === next.repo
}

/**
 * Records lookup results, reading the store right before writing so other sessions' mappings and overrides stay; past the cap, the least recently resolved looked-up mappings are dropped.
 *
 * @param host the engine
 * @param updates the results by `<ecosystem>:<name>`
 * @returns the mappings as stored now
 */
export async function saveDepFeeds(
  host: Host,
  updates: Readonly<Record<string, DepFeed>>,
): Promise<Record<string, DepFeed>> {
  const stored = depFeedsOf(await host.storeGet(STORE_KEYS.depFeeds))
  const next = { ...stored }

  for (const [key, feed] of Object.entries(updates)) {
    if (isReplaceable(Object.hasOwn(stored, key) ? stored[key] : undefined, feed)) {
      next[key] = feed
    }
  }

  const capped = cappedDepFeeds(next)

  await host.storeSet(STORE_KEYS.depFeeds, capped)

  return capped
}
