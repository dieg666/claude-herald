import type { StackProject } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { isRecord } from './is-record.js'
import { stackProjectOf } from './stack-project-of.js'

/**
 * One project's stack releases as stored; an empty record for a project never refreshed.
 *
 * @param host the engine
 * @param root the project's root path
 */
export async function loadStackProject(host: Host, root: string): Promise<StackProject> {
  const stored = await host.storeGet(STORE_KEYS.stack)
  const projects = isRecord(stored) ? stored : {}

  return stackProjectOf(Object.hasOwn(projects, root) ? projects[root] : undefined)
}
