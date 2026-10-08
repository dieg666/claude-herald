import type { Dependency, DepsProject } from '../../../types/index.js'
import { depFeedKeyOf } from '../resolve/dep-feed-key-of.js'
import { selectDeps } from './select-deps.js'

/**
 * The followed dependencies and how many distinct ones were found.
 */
type Selection = { followed: Dependency[]; detectedCount: number }

/**
 * Picks the dependencies to follow from a scan and the user's lists: ignored packages never, hand-added ones always (as detected when a manifest declares them too, since that carries the version in use), and the detected ones as `selectDeps` picks them in the room the added ones leave under the cap.
 *
 * @param dependencies every declaration a scan found, in scan order
 * @param project the project's settings, ignored and added packages
 * @returns the followed dependencies, detected first then added, and how many distinct ones the scan found, ignored ones included
 */
export function followedOf(
  dependencies: readonly Dependency[],
  project: Pick<DepsProject, 'settings' | 'ignored' | 'added'>,
): Selection {
  const { settings } = project
  const ignored = new Set(project.ignored)
  const kept = dependencies.filter(dependency => !ignored.has(depFeedKeyOf(dependency)))
  const detected = new Map(
    selectDeps(kept, { includeDev: true, cap: Number.POSITIVE_INFINITY }).followed.map(
      dependency => [depFeedKeyOf(dependency), dependency],
    ),
  )
  const added = (project.added ?? [])
    .filter(dependency => !ignored.has(depFeedKeyOf(dependency)))
    .map(dependency => detected.get(depFeedKeyOf(dependency)) ?? dependency)
    .slice(0, settings.cap)
  const addedKeys = new Set(added.map(depFeedKeyOf))
  const { followed } = selectDeps(
    kept.filter(dependency => !addedKeys.has(depFeedKeyOf(dependency))),
    { includeDev: settings.includeDev, cap: settings.cap - added.length },
  )

  return {
    followed: [...followed, ...added],
    detectedCount: new Set(dependencies.map(depFeedKeyOf)).size,
  }
}
