import type { Rejection } from './rejection.js'
import { SUMMARY_LIMITS } from './summary-limits.js'

/**
 * Whether an item, language and kind gets no summary request for now: enough replies were rejected and the last one is inside the window.
 *
 * @param rejection the replies rejected so far, if any
 * @param now the clock, in ms since the epoch
 */
export function isMuted(rejection: Rejection | undefined, now: number): boolean {
  return (
    rejection !== undefined &&
    rejection.count >= SUMMARY_LIMITS.rejectedTries &&
    now - rejection.at >= 0 &&
    now - rejection.at < SUMMARY_LIMITS.rejectedWindowMs
  )
}
