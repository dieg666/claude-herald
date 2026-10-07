import type { Dependency } from '../../types/index.js'
import Store from '../../hooks/store'

/**
 * The followed dependencies a store Map keeps for a project root.
 *
 * @param stored the test's store
 * @param root the project root
 */
export function depsAt(stored: ReadonlyMap<string, unknown>, root: string): Dependency[] {
  const projects = Store.depsProjectsOf(stored.get('deps'))

  return Store.depsProjectOf(projects[root]).dependencies
}
