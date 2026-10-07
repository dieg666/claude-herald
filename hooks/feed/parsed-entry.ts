/** One feed entry as plain text: an RSS item or an Atom entry. */
export type ParsedEntry = {
  /** The entry's guid (RSS) or id (Atom), as written. */
  readonly guid?: string
  /** The entry's absolute http(s) link. */
  readonly link?: string
  /** The headline, entities decoded and markup removed. */
  readonly title: string
  /** The description or content as one line of plain text, capped. */
  readonly summary?: string
  /** When the entry was published (or last updated), as an ISO 8601 string. */
  readonly publishedAt?: string
  /** The entry's own language tag, when it declares one. */
  readonly lang?: string
}
