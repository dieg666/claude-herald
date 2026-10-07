import type { DepFeed, Dependency } from '../../../types/index.js'
import type { Host } from '../../host/host.js'
import { putDepOverride } from '../../store/put-dep-override.js'
import { depFeedKeyOf } from './dep-feed-key-of.js'
import { overrideTargetOf } from './override-target-of.js'

/**
 * Maps a package to a GitHub repository (its feed checked at the next resolution) or a feed URL, winning over lookups until cleared.
 *
 * @param host the engine
 * @param dependency the package
 * @param target `owner/repo`, a github.com repository URL or a feed URL
 * @returns the override as stored, or undefined when the target is none of those (nothing stored)
 */
export async function setOverride(
  host: Host,
  dependency: Pick<Dependency, 'ecosystem' | 'name'>,
  target: string,
): Promise<DepFeed | undefined> {
  const parsed = overrideTargetOf(target)

  return parsed === undefined ? undefined : putDepOverride(host, depFeedKeyOf(dependency), parsed)
}
