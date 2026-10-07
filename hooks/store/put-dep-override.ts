import type { DepFeed } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { depFeedsOf } from './dep-feeds-of.js'

/**
 * Sets a package's override, stamped with the clock, reading the store right before writing.
 *
 * @param host the engine
 * @param key the package, `<ecosystem>:<name>`
 * @param target the repository or the feed URL it maps to
 * @returns the override as stored
 */
export async function putDepOverride(
  host: Host,
  key: string,
  target: { repo: string } | { feed: string },
): Promise<DepFeed> {
  const override: DepFeed = { ...target, resolvedAt: await host.clockNow(), isOverride: true }
  const stored = depFeedsOf(await host.storeGet(STORE_KEYS.depFeeds))

  await host.storeSet(STORE_KEYS.depFeeds, { ...stored, [key]: override })

  return override
}
