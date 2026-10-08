import type { DepsProject, StackProject, StackState } from '../../../types/index.js'
import { timeOf } from '../../items/time-of.js'
import { depFeedKeyOf } from '../resolve/dep-feed-key-of.js'
import { STACK_LIMITS } from './stack-limits.js'

/**
 * The stack state of a project: its settings, the kept releases of the dependencies it follows now (newest first, at most `STACK_LIMITS.itemsPerProject`), and the filter kept while the project stays the same.
 *
 * @param root the project root
 * @param project its stack record
 * @param stack its stored releases
 * @param current the stack in state now, whose filter stays for the same project
 */
export function stackStateOf(
  root: string,
  project: DepsProject,
  stack: StackProject,
  current: Pick<StackState, 'root' | 'filter'>,
): StackState {
  const followed = new Set(project.dependencies.map(depFeedKeyOf))
  const items = Object.entries(stack.deps)
    .filter(([key]) => followed.has(key))
    .flatMap(([, dep]) => dep.items)
    .map((item, index) => ({ item, index, time: timeOf(item.publishedAt) }))
    .sort((a, b) => (a.time === b.time ? a.index - b.index : b.time - a.time))
    .slice(0, STACK_LIMITS.itemsPerProject)
    .map(({ item }) => item)

  return {
    root,
    settings: project.settings,
    items,
    filter: current.root === root ? current.filter : '',
  }
}
