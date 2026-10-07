import type { Dependency, DepsSettings } from '../../../types/index.js'

/**
 * The followed dependencies and how many distinct ones were found.
 */
type Selection = { followed: Dependency[]; detectedCount: number }

/**
 * Picks the dependencies to follow: one per ecosystem and name (the runtime, root-declared, first-found declaration wins), dev ones only when included, runtime then root-declared first, at most `cap`.
 *
 * @param dependencies every declaration a scan found, in scan order
 * @param settings the project's dev toggle and cap
 */
export function selectDeps(
  dependencies: readonly Dependency[],
  settings: Pick<DepsSettings, 'includeDev' | 'cap'>,
): Selection {
  const rank = (dependency: Dependency) => (dependency.isDev ? 2 : 0) + (dependency.isRoot ? 0 : 1)
  const ordered = dependencies
    .map((dependency, index) => ({ dependency, index }))
    .sort((a, b) => rank(a.dependency) - rank(b.dependency) || a.index - b.index)
    .map(({ dependency }) => dependency)
  const unique = new Map<string, Dependency>()

  for (const dependency of ordered) {
    const key = `${dependency.ecosystem}\u0000${dependency.name}`

    if (!unique.has(key)) {
      unique.set(key, dependency)
    }
  }

  const followed = [...unique.values()]
    .filter(dependency => settings.includeDev || !dependency.isDev)
    .slice(0, Math.max(0, Math.floor(settings.cap)))

  return { followed, detectedCount: unique.size }
}
