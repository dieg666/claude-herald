import type { DepFeed, DepsProject, StackProgress, StackProject } from '../../../types/index.js'
import { depFeedKeyOf } from '../resolve/dep-feed-key-of.js'

/**
 * How far following a project's stack got: whether it was detected, the manifests and dependencies the last detection found, and of the packages followed, how many had their release feed read and how many others are known to have none.
 *
 * @param project its stack record
 * @param stack its stored releases
 * @param feeds the cached feed mappings by `<ecosystem>:<name>`
 */
export function stackProgressOf(
  project: DepsProject,
  stack: StackProject,
  feeds: Readonly<Record<string, DepFeed>>,
): StackProgress {
  const keys = [...new Set(project.dependencies.map(depFeedKeyOf))]
  const isChecked = (key: string) => Object.hasOwn(stack.deps, key)
  const hasNoFeed = (key: string) => {
    const entry = Object.hasOwn(feeds, key) ? feeds[key] : undefined

    return entry !== undefined && entry.feed === undefined && entry.reason !== undefined
  }

  return {
    isDetected: project.detectedAt > 0,
    manifests: Object.keys(project.manifestHashes).length,
    detected: project.detectedCount,
    followed: keys.length,
    checked: keys.filter(isChecked).length,
    unresolved: keys.filter(key => !isChecked(key) && hasNoFeed(key)).length,
  }
}
