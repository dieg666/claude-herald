import type { ReleaseFlagsEntry } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { releaseFlagEntriesOf } from './release-flag-entries-of.js'
import { withReleaseFlags } from './with-release-flags.js'

/**
 * Caches a release verdict as the newest entry, reading the store right before writing.
 *
 * @param host the engine
 * @param entry the verdict
 * @returns the cache as stored now, oldest first
 */
export async function putReleaseFlags(
  host: Host,
  entry: ReleaseFlagsEntry,
): Promise<ReleaseFlagsEntry[]> {
  const next = withReleaseFlags(
    releaseFlagEntriesOf(await host.storeGet(STORE_KEYS.releaseFlags)),
    entry,
  )

  await host.storeSet(STORE_KEYS.releaseFlags, next)

  return next
}
