import type { Dependency } from '../../../types/index.js'
import type { Host } from '../../host/host.js'
import { removeDepOverride } from '../../store/remove-dep-override.js'
import { depFeedKeyOf } from './dep-feed-key-of.js'

/**
 * Drops a package's override; the next resolution looks it up in its registry again.
 *
 * @param host the engine
 * @param dependency the package
 * @returns whether it had an override
 */
export function clearOverride(
  host: Host,
  dependency: Pick<Dependency, 'ecosystem' | 'name'>,
): Promise<boolean> {
  return removeDepOverride(host, depFeedKeyOf(dependency))
}
