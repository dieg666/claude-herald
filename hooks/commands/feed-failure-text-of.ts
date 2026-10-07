import type { FeedFailure } from '../feed/feed-failure.js'

/**
 * Why an address is refused as a feed, as one sentence.
 *
 * @param reason the parser's failure
 * @param url the address
 */
export function feedFailureTextOf(reason: FeedFailure, url: string): string {
  switch (reason) {
    case 'empty':
      return `${url} answered with nothing, so it was not added.`
    case 'truncated':
      return `The feed at ${url} is cut short, so it was not added.`
    case 'not-a-feed':
      return `${url} is not an RSS or Atom feed, so it was not added. For a web page, use /news add-page ${url}.`
  }
}
