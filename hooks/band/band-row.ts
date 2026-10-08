/**
 * One item as the band draws it: its source's glyph, the headline fitted to the width (a link when the address is http(s)), and the one-line summary when there is one; an item without usable text, or whose summary replies were rejected for now, has no summary line.
 */
export type BandRow = {
  readonly id: string
  readonly icon: string
  readonly title: string
  /** The item's address, only when it is http(s). */
  readonly href?: string
  /** Undefined while the summary is pending, and when the row has none. */
  readonly summary?: string
  /** Present, true, when the item gets no summary line and no placeholder: it has no usable text, or its summary replies were rejected for now. */
  readonly hasNoSummary?: true
  readonly isSelected: boolean
}
