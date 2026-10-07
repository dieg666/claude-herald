import type { Limiter } from './limiter.js'

/**
 * What summary requests share for one load of the module: the limiter bounding model calls, and the queue that orders cache and state writes.
 */
export type SummaryJobs = {
  readonly limiter: Limiter
  readonly serially: <T>(task: () => Promise<T>) => Promise<T>
}
