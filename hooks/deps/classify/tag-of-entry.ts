import type { ParsedEntry } from '../../feed/parsed-entry.js'

/**
 * A text percent-decoded, or as it is when it is not valid percent-encoding.
 *
 * @param text part of a URL
 */
function decodedOf(text: string): string {
  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}

/**
 * The git tag a GitHub release or tag entry is for, from its id (`tag:github.com,2008:Repository/<n>/<tag>`) or its link (`.../releases/tag/<tag>`); undefined for other feeds.
 *
 * @param entry the feed entry
 */
export function tagOfEntry(entry: Pick<ParsedEntry, 'guid' | 'link'>): string | undefined {
  const fromGuid = /^tag:github\.com,2008:Repository\/\d+\/(.+)$/.exec(entry.guid ?? '')?.[1]
  const fromLink = /\/releases\/tag\/([^?#]+)$/.exec(entry.link ?? '')?.[1]
  const tag = fromGuid ?? (fromLink === undefined ? undefined : decodedOf(fromLink))

  return tag?.trim() === '' ? undefined : tag?.trim()
}
