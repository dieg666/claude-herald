import type { Host } from '../../host/host.js'
import { messageOf } from '../../refresh/message-of.js'
import type { SummaryJobs } from '../../summaries/summary-jobs.js'
import { detectDeps } from '../detect/detect-deps.js'
import { projectRootOf } from '../detect/project-root-of.js'
import { mirrorStack } from './mirror-stack.js'
import { refreshStack } from './refresh-stack.js'
import type { StackLoop } from './stack-loop.js'
import type { StackRun } from './stack-run.js'

/**
 * The session's start of the stack, run off its dispatch: the project's kept releases into state, the stack detected, then the first stack refresh; refreshes asked before it is done do nothing. Never throws.
 *
 * @param host the engine
 * @param loop the loop
 * @param jobs the limiter shared with summaries
 * @returns the first refresh
 */
export async function startStack(
  host: Host,
  loop: StackLoop,
  jobs: SummaryJobs,
): Promise<StackRun> {
  const root = await projectRootOf(host).catch(() => undefined)

  if (root !== undefined) {
    loop.root = root.path

    await mirrorStack(host, root.path).catch((error: unknown) => {
      host.debug(`herald: deps: could not load the stack's releases: ${messageOf(error)}`)
    })
  }

  // This detection serves a rescan asked so far.
  loop.isDetectPending = false
  await detectDeps(host, root)

  loop.isStarted = true

  return refreshStack(host, loop, jobs)
}
