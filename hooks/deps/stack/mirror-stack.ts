import type { StackState } from '../../../types/index.js'
import type { Host } from '../../host/host.js'
import { loadDepFeeds } from '../../store/load-dep-feeds.js'
import { loadDepsProject } from '../../store/load-deps-project.js'
import { loadStackProject } from '../../store/load-stack-project.js'
import { stackStateOf } from './stack-state-of.js'

/**
 * Copies a project's stack settings, kept releases and how far following it got from the store into state.
 *
 * @param host the engine
 * @param root the project root
 * @returns the stack as in state now
 */
export async function mirrorStack(host: Host, root: string): Promise<StackState> {
  const project = await loadDepsProject(host, root)
  const stack = await loadStackProject(host, root)
  const feeds = await loadDepFeeds(host)

  return host.state.stack.update(current => stackStateOf(root, project, stack, current, feeds))
}
