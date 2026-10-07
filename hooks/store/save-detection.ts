import type { DepsProject } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { depsProjectOf } from './deps-project-of.js'
import { depsProjectsOf } from './deps-projects-of.js'

/**
 * What one detection run found for a project.
 */
type Detection = Omit<DepsProject, 'settings'>

/**
 * Records a project's detection, reading the store right before writing so its settings and other projects stay.
 *
 * @param host the engine
 * @param root the project's root path
 * @param detection the followed dependencies, the count found and the manifest hashes
 * @returns the project's record as stored now
 */
export async function saveDetection(
  host: Host,
  root: string,
  detection: Detection,
): Promise<DepsProject> {
  const projects = depsProjectsOf(await host.storeGet(STORE_KEYS.deps))
  const stored = depsProjectOf(Object.hasOwn(projects, root) ? projects[root] : undefined)
  const next: DepsProject = { ...stored, ...detection }

  await host.storeSet(STORE_KEYS.deps, { ...projects, [root]: next })

  return next
}
