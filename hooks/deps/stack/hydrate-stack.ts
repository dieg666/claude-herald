import type { Host } from '../../host/host.js'
import { messageOf } from '../../refresh/message-of.js'
import { mirrorStack } from './mirror-stack.js'
import type { StackLoop } from './stack-loop.js'

/**
 * Copies the stack of the project last looked at back into state, after `/clear`, `/resume` or `/branch` reset it; does nothing before a session start has found the project, so it never touches the filesystem. Never throws.
 *
 * @param host the engine
 * @param loop the loop
 */
export async function hydrateStack(host: Host, loop: StackLoop): Promise<void> {
  if (loop.root === undefined) {
    return
  }

  await mirrorStack(host, loop.root).catch((error: unknown) => {
    host.debug(`news: deps: could not load the stack's releases: ${messageOf(error)}`)
  })
}
