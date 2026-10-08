/**
 * One item as the band draws it: the headline fitted to the width (a link when the address is http(s)) with its source's name dim at the right end when there is room, and the one-line summary when there is one; an item without usable text, or whose summary replies were rejected for now, has no summary line.
 */
export type BandRow = {
  readonly id: string
  /** The release glyph of a stack row; a news row has none. */
  readonly icon?: string
  readonly title: string
  /** The source's name, cut to the room left; absent when it would repeat the title, the source is gone or there is no room. */
  readonly source?: string
  /** The spaces between the headline and `source`, so the name ends at the last cell. */
  readonly sourceGap?: string
  /** The item's address, only when it is http(s). */
  readonly href?: string
  /** Undefined while the summary is pending, and when the row has none. */
  readonly summary?: string
  /** Present, true, when the item gets no summary line and no placeholder: it has no usable text, or its summary replies were rejected for now. */
  readonly hasNoSummary?: true
  readonly isSelected: boolean
}
