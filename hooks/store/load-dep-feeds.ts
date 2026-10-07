import type { DepFeed } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { depFeedsOf } from './dep-feeds-of.js'

/**
 * The stored feed mappings by `<ecosystem>:<name>`.
 *
 * @param host the engine
 */
export async function loadDepFeeds(host: Host): Promise<Record<string, DepFeed>> {
  return depFeedsOf(await host.storeGet(STORE_KEYS.depFeeds))
}
