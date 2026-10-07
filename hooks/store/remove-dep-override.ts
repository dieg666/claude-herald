import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { depFeedsOf } from './dep-feeds-of.js'

/**
 * Drops a package's override so the next resolution looks it up again, reading the store right before writing; a looked-up mapping is left alone.
 *
 * @param host the engine
 * @param key the package, `<ecosystem>:<name>`
 * @returns whether there was an override to drop
 */
export async function removeDepOverride(host: Host, key: string): Promise<boolean> {
  const stored = depFeedsOf(await host.storeGet(STORE_KEYS.depFeeds))

  if (!Object.hasOwn(stored, key) || stored[key]?.isOverride !== true) {
    return false
  }

  const kept = { ...stored }

  delete kept[key]
  await host.storeSet(STORE_KEYS.depFeeds, kept)

  return true
}
