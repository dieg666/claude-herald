import type { Limiter } from './limiter.js'
import type { Rejection } from './rejection.js'

/**
 * What summary requests share for one load of the module: the limiter bounding model calls, the queue that orders cache and state writes, and the rejected replies by summary key.
 */
export type SummaryJobs = {
  readonly limiter: Limiter
  readonly serially: <T>(task: () => Promise<T>) => Promise<T>
  readonly rejected: Map<string, Rejection>
}
