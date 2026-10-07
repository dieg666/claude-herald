import type { Item } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { ensureVisibleSummaries } from './ensure-visible-summaries.js'
import type { SummaryJobs } from './summary-jobs.js'
import { SUMMARY_LIMITS } from './summary-limits.js'

/**
 * One-line summaries for the items a refresh run reports as new (none on a first load), the newest few only; never throws.
 *
 * @param host the engine
 * @param jobs the limiter and write queue
 * @param items the run's new items, newest first
 * @param signal the run's, aborting the model calls
 */
export async function summarizeNew(
  host: Host,
  jobs: SummaryJobs,
  items: readonly Item[],
  signal?: AbortSignal,
): Promise<void> {
  if (items.length > 0) {
    await ensureVisibleSummaries(host, jobs, items.slice(0, SUMMARY_LIMITS.newPerRun), signal)
  }
}
