import type { DepsProject } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { depsProjectOf } from './deps-project-of.js'
import { DEPS_PROJECTS_MAX } from './deps-projects-max.js'
import { depsProjectsOf } from './deps-projects-of.js'

/**
 * Changes one project's stack record (its settings, ignored or added packages), reading the store right before writing so other projects and sessions' changes stay; the result is cleaned as a stored record is, and past the most projects kept the least recently detected others are dropped.
 *
 * @param host the engine
 * @param root the project's root path
 * @param change the new record from the stored one
 * @returns the project's record as stored now
 */
export async function updateDepsProject(
  host: Host,
  root: string,
  change: (project: DepsProject) => DepsProject,
): Promise<DepsProject> {
  const projects = depsProjectsOf(await host.storeGet(STORE_KEYS.deps))
  const before = depsProjectOf(Object.hasOwn(projects, root) ? projects[root] : undefined)
  const next = depsProjectOf(change(before))
  const kept = Object.entries(projects)
    .filter(([path]) => path !== root)
    .sort(([, a], [, b]) => depsProjectOf(b).detectedAt - depsProjectOf(a).detectedAt)
    .slice(0, DEPS_PROJECTS_MAX - 1)

  await host.storeSet(STORE_KEYS.deps, { ...Object.fromEntries(kept), [root]: next })

  return next
}
