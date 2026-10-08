import type { ReleaseFlagsEntry } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { releaseFlagEntriesOf } from './release-flag-entries-of.js'

/**
 * The cached release verdicts, oldest first.
 *
 * @param host the engine
 */
export async function loadReleaseFlags(host: Host): Promise<ReleaseFlagsEntry[]> {
  return releaseFlagEntriesOf(await host.storeGet(STORE_KEYS.releaseFlags))
}
