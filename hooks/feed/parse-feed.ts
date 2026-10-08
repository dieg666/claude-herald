import { atomFeedOf } from './atom-feed-of.js'
import type { FeedResult } from './feed-result.js'
import { feedKindOf } from './feed-kind-of.js'
import { rssFeedOf } from './rss-feed-of.js'
import { scanXml } from './xml/scan-xml.js'

const BLANK = /^[\s\uFEFF]*$/

/** An RSS or Atom document as plain-text entries, or why it is not a feed; `limits.summaryChars` raises or lowers the summary cap (default `FEED_LIMITS.summaryChars`); never throws. */
export function parseFeed(
  xml: string,
  baseUrl?: string,
  limits: { readonly summaryChars?: number } = {},
): FeedResult {
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

  const { summaryChars } = limits
  const feed =
    kind === 'atom'
      ? atomFeedOf(root, baseUrl, summaryChars)
      : rssFeedOf(root, baseUrl, summaryChars)

  return feed ? { ok: true, feed } : { ok: false, reason: 'not-a-feed' }
}
