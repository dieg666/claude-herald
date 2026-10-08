import type { Dependency } from '../../../types/index.js'
import type { ParsedEntry } from '../../feed/parsed-entry.js'
import { depFeedKeyOf } from '../resolve/dep-feed-key-of.js'

/**
 * A release feed entry's id: `<ecosystem>:<name>|<entry guid, link or title>`, what the model's flags are cached and releases are seen under.
 *
 * @param dependency the package
 * @param entry the feed entry
 */
export function releaseIdOf(
  dependency: Pick<Dependency, 'ecosystem' | 'name'>,
  entry: Pick<ParsedEntry, 'guid' | 'link' | 'title'>,
): string {
  return `${depFeedKeyOf(dependency)}|${entry.guid ?? entry.link ?? entry.title}`
}
