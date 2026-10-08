import type { DepFeed } from '../../../types/index.js'
import { RESOLVE_LIMITS } from '../resolve/resolve-limits.js'

/**
 * Whether resolving a package would ask its registry or GitHub, as `resolveDeps` decides: not for a feed override, nor for a mapping (negative ones included) younger than the TTL.
 *
 * @param entry the package's cached mapping
 * @param now the clock, in milliseconds since the epoch
 */
export function needsLookup(entry: DepFeed | undefined, now: number): boolean {
  if (entry === undefined) {
    return true
  }

  if (entry.isOverride === true && entry.repo === undefined) {
    return false
  }

  const age = now - entry.resolvedAt

  return !(
    age >= 0 &&
    age < RESOLVE_LIMITS.ttlMs &&
    (entry.feed !== undefined || entry.reason !== undefined)
  )
}
