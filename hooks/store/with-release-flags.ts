import type { ReleaseFlagsEntry } from '../../types/index.js'
import { RELEASE_FLAGS_MAX } from './release-flags-max.js'

/**
 * The cache with a verdict added as the newest, replacing one for the same release, the oldest evicted past the cap.
 *
 * @param entries the cache, oldest first
 * @param entry the verdict to add
 * @param max how many entries to keep
 */
export function withReleaseFlags(
  entries: readonly ReleaseFlagsEntry[],
  entry: ReleaseFlagsEntry,
  max: number = RELEASE_FLAGS_MAX,
): ReleaseFlagsEntry[] {
  const others = entries.filter(other => other.releaseId !== entry.releaseId)
  const room = Math.max(0, Math.floor(max))

  return room === 0 ? [] : [...others, entry].slice(-room)
}
