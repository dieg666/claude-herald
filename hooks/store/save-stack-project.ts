import type { StackProject } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { isRecord } from './is-record.js'
import { STACK_PROJECTS_MAX } from './stack-projects-max.js'
import { stackProjectOf } from './stack-project-of.js'

/**
 * Changes one project's stack releases, reading the store right before writing so other projects stay; the record is stamped with the clock, and past the most projects kept the least recently refreshed others are dropped.
 *
 * @param host the engine
 * @param root the project's root path
 * @param change the new record from the stored one
 * @returns the project's record as stored now
 */
export async function saveStackProject(
  host: Host,
  root: string,
  change: (project: StackProject) => Omit<StackProject, 'refreshedAt'>,
): Promise<StackProject> {
  const stored = await host.storeGet(STORE_KEYS.stack)
  const projects = isRecord(stored) ? stored : {}
  const before = stackProjectOf(Object.hasOwn(projects, root) ? projects[root] : undefined)
  const next: StackProject = { ...change(before), refreshedAt: await host.clockNow() }
  const kept = Object.entries(projects)
    .filter(([path]) => path !== root)
    .sort(([, a], [, b]) => stackProjectOf(b).refreshedAt - stackProjectOf(a).refreshedAt)
    .slice(0, STACK_PROJECTS_MAX - 1)

  await host.storeSet(STORE_KEYS.stack, { ...Object.fromEntries(kept), [root]: next })

  return next
}
