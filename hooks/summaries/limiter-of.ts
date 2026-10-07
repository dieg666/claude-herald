import type { Limiter } from './limiter.js'
import { SUMMARY_LIMITS } from './summary-limits.js'

/**
 * An idle limiter.
 *
 * @param max the most tasks running at once, at least 1
 */
export function limiterOf(max: number = SUMMARY_LIMITS.concurrentRequests): Limiter {
  return { max: Math.max(1, Math.floor(max)), active: 0, waiting: [], inFlight: new Map() }
}
