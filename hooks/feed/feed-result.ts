import type { FeedFailure } from './feed-failure.js'
import type { ParsedFeed } from './parsed-feed.js'

/** What parsing a document yields: the feed, or why there is none. */
export type FeedResult =
  | { readonly ok: true; readonly feed: ParsedFeed }
  | { readonly ok: false; readonly reason: FeedFailure }
