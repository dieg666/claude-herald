import type { ReleaseFlagsEntry } from '../../types/index.js'
import { isRecord } from './is-record.js'

/**
 * The stored release verdicts, oldest first, dropping entries that are not one.
 *
 * @param value what the store holds under `releaseFlags`
 */
export function releaseFlagEntriesOf(value: unknown): ReleaseFlagsEntry[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap(entry =>
    isRecord(entry) &&
    typeof entry.releaseId === 'string' &&
    typeof entry.breaking === 'boolean' &&
    typeof entry.security === 'boolean'
      ? [{ releaseId: entry.releaseId, breaking: entry.breaking, security: entry.security }]
      : [],
  )
}
