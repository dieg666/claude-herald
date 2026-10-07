import type { DepsProject } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { depsProjectOf } from './deps-project-of.js'
import { depsProjectsOf } from './deps-projects-of.js'

/**
 * One project's stack record, defaults filling whatever is missing; an empty record for a project never detected.
 *
 * @param host the engine
 * @param root the project's root path
 */
export async function loadDepsProject(host: Host, root: string): Promise<DepsProject> {
  const projects = depsProjectsOf(await host.storeGet(STORE_KEYS.deps))

  return depsProjectOf(Object.hasOwn(projects, root) ? projects[root] : undefined)
}
