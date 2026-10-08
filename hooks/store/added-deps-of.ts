import type { Dependency } from '../../types/index.js'
import { dependencyOf } from './dependency-of.js'
import { DEPS_LIST_MAX } from './deps-list-max.js'

/**
 * Stored hand-added packages, entries that are not a dependency dropped, one per ecosystem and name (the first kept), at most `DEPS_LIST_MAX`; empty when the value is not a list.
 *
 * @param value what a project's record holds under `added`
 */
export function addedDepsOf(value: unknown): Dependency[] {
  if (!Array.isArray(value)) {
    return []
  }

  const unique = new Map<string, Dependency>()

  for (const entry of value) {
    const dependency = dependencyOf(entry)
    const key = dependency === undefined ? '' : `${dependency.ecosystem}:${dependency.name}`

    if (dependency !== undefined && !unique.has(key)) {
      unique.set(key, dependency)
    }
  }

  return [...unique.values()].slice(0, DEPS_LIST_MAX)
}
