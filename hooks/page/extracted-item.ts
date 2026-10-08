/**
 * One news item a page lists, as validated from the model's reply.
 */
export type ExtractedItem = {
  /** The headline, trimmed and capped. */
  title: string
  /** An absolute http(s) address. */
  url: string
  /** An ISO 8601 timestamp; absent when the page gave no usable date. */
  publishedAt?: string
  /** The one-line description the page shows with the headline, trimmed and capped; absent when it shows none. */
  teaser?: string
}
