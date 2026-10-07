import { parseFeed } from '../../feed/parse-feed.js'
import type { FeedCheck } from './feed-check.js'
import type { Get } from './get.js'

/**
 * A GitHub repository's release feed: `releases.atom` when it has entries, else `tags.atom`; a missing repository is a definite none. Never rejects.
 *
 * @param get the gentle fetch
 * @param repo the repository, `owner/repo`
 */
export async function feedOfRepo(get: Get, repo: string): Promise<FeedCheck> {
  const releases = `https://github.com/${repo}/releases.atom`
  const outcome = await get(releases)

  if (outcome.kind === 'missing') {
    return { kind: 'none', reason: `repository not found on GitHub: ${repo}` }
  }

  if (outcome.kind === 'failed') {
    return outcome
  }

  const parsed = parseFeed(outcome.text, releases)

  if (!parsed.ok) {
    return { kind: 'failed', reason: `releases feed unreadable (${parsed.reason})` }
  }

  return {
    kind: 'feed',
    feed: parsed.feed.entries.length > 0 ? releases : `https://github.com/${repo}/tags.atom`,
  }
}
