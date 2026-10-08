import type { Source } from '../../types/index.js'
import { isReleaseFeed } from '../items/is-release-feed.js'
import { isVersionOnly } from '../items/is-version-only.js'

/**
 * Whether a news item reads as a release, its source drawn in the release color: its source is a GitHub release or tag feed, or its title is only a version.
 *
 * @param title the item's headline
 * @param source its source, undefined when gone
 */
export function isReleaseNews(title: string, source: Pick<Source, 'url'> | undefined): boolean {
  return isVersionOnly(title) || (source !== undefined && isReleaseFeed(source.url))
}
