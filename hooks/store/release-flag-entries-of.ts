import type { ReleaseFlagsEntry } from '../../types/index.js'
import { isRecord } from './is-record.js'

/**
 * Whether a stored count of malformed answers is absent or a positive whole number.
 *
 * @param value the stored count
 */
function isCount(value: unknown): value is number | undefined {
  return value === undefined || (Number.isInteger(value) && (value as number) > 0)
}

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
    typeof entry.security === 'boolean' &&
    isCount(entry.malformed)
      ? [
          {
            releaseId: entry.releaseId,
            breaking: entry.breaking,
            security: entry.security,
            ...(entry.malformed === undefined ? {} : { malformed: entry.malformed }),
          },
        ]
      : [],
  )
}
