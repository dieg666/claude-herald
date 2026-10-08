import { serialOf } from '../refresh/serial-of.js'
import type { Limiter } from './limiter.js'
import { limiterOf } from './limiter-of.js'
import type { SummaryJobs } from './summary-jobs.js'

/**
 * Summary jobs over a limiter, which other model work may share.
 *
 * @param limiter bounds the model calls
 */
export function summaryJobsOf(limiter: Limiter = limiterOf()): SummaryJobs {
  return { limiter, serially: serialOf(), rejected: new Map() }
}
