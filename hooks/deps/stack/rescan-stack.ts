import type { Host } from '../../host/host.js'
import type { SummaryJobs } from '../../summaries/summary-jobs.js'
import { refreshStack } from './refresh-stack.js'
import type { StackLoop } from './stack-loop.js'
import type { StackRun } from './stack-run.js'

/**
 * Detects the project's stack again and refreshes its releases, off any hook's dispatch: one refresh run that detects first. While a refresh runs it waits for one more run after it, however many rescans are asked meanwhile; before the start detection it does nothing beyond what the start does. Never throws.
 *
 * @param host the engine
 * @param loop the loop
 * @param jobs the limiter shared with summaries
 * @returns the refresh run, skipped when it was queued behind another
 */
export function rescanStack(host: Host, loop: StackLoop, jobs: SummaryJobs): Promise<StackRun> {
  loop.isDetectPending = true

  return refreshStack(host, loop, jobs)
}
