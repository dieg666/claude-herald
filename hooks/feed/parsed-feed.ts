import type { FeedKind } from './feed-kind.js'
import type { ParsedEntry } from './parsed-entry.js'

/** A whole feed as plain text, entries in document order. */
export type ParsedFeed = {
  readonly kind: FeedKind
  /** The feed's title, possibly empty. */
  readonly title: string
  /** The feed's home page, an absolute http(s) URL. */
  readonly link?: string
  /** The feed's language tag, when it declares one. */
  readonly lang?: string
  readonly entries: readonly ParsedEntry[]
}
