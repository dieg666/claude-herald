import type { ParsedEntry } from '../../hooks/feed'

/**
 * A GitHub release feed entry for a tag, titled with the tag unless told otherwise.
 *
 * @param tag the git tag
 * @param notes the release notes as plain text
 * @param title the release title
 */
export function releaseAt(tag: string, notes?: string, title: string = tag): ParsedEntry {
  return {
    guid: `tag:github.com,2008:Repository/1/${tag}`,
    link: `https://github.com/owner/repo/releases/tag/${tag}`,
    title,
    ...(notes === undefined ? {} : { summary: notes }),
  }
}
