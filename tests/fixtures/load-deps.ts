import type { Host } from '../../hooks/host'
import Store from '../../hooks/store'

/**
 * A project's stack record as the store keeps it.
 *
 * @param host the fake Host
 * @param root the project root
 */
export function loadDeps(host: Host, root: string) {
  return Store.loadDepsProject(host, root)
}
