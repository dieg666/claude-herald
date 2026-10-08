const RELEASE_FEED =
  /^https?:\/\/(?:www\.)?github\.com\/[^/?#]+\/[^/?#]+\/(?:releases|tags)\.atom(?:[?#].*)?$/i

/**
 * Whether a source's address is a GitHub repository's release or tag feed, `https://github.com/OWNER/REPO/releases.atom` or `tags.atom`.
 *
 * @param url the source's address
 */
export function isReleaseFeed(url: string): boolean {
  return RELEASE_FEED.test(url.trim())
}
