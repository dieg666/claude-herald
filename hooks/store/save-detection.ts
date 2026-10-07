import type { DepsProject } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { depsProjectOf } from './deps-project-of.js'
import { DEPS_PROJECTS_MAX } from './deps-projects-max.js'
import { depsProjectsOf } from './deps-projects-of.js'

/**
 * What one detection run found for a project.
 */
type Detection = Omit<DepsProject, 'settings' | 'detectedAt'>

/**
 * Records a project's detection stamped with the clock, reading the store right before writing so its settings and other projects stay; past the most projects kept, the least recently detected others are dropped.
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
  const next: DepsProject = { ...stored, ...detection, detectedAt: await host.clockNow() }
  const kept = Object.entries(projects)
    .filter(([path]) => path !== root)
    .sort(([, a], [, b]) => depsProjectOf(b).detectedAt - depsProjectOf(a).detectedAt)
    .slice(0, DEPS_PROJECTS_MAX - 1)

  await host.storeSet(STORE_KEYS.deps, { ...Object.fromEntries(kept), [root]: next })

  return next
}
