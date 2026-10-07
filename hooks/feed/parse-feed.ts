import { atomFeedOf } from './atom-feed-of.js'
import type { FeedResult } from './feed-result.js'
import { feedKindOf } from './feed-kind-of.js'
import { rssFeedOf } from './rss-feed-of.js'
import { scanXml } from './xml/scan-xml.js'

const BLANK = /^[\s\uFEFF]*$/

/** An RSS or Atom document as plain-text entries, or why it is not a feed; never throws. */
export function parseFeed(xml: string, baseUrl?: string): FeedResult {
  if (BLANK.test(xml)) {
    return { ok: false, reason: 'empty' }
  }

  const { root, closed } = scanXml(xml)
  const kind = root && feedKindOf(root)

  if (!root || !kind) {
    return { ok: false, reason: 'not-a-feed' }
  }

  if (!closed) {
    return { ok: false, reason: 'truncated' }
  }

  const feed = kind === 'atom' ? atomFeedOf(root, baseUrl) : rssFeedOf(root, baseUrl)

  return feed ? { ok: true, feed } : { ok: false, reason: 'not-a-feed' }
}
