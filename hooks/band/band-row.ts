/**
 * One item as the band draws it: its source's glyph, the headline fitted to the width (a link when the address is http(s)), and the one-line summary when there is one.
 */
export type BandRow = {
  readonly id: string
  readonly icon: string
  readonly title: string
  /** The item's address, only when it is http(s). */
  readonly href?: string
  /** Undefined while the summary is pending. */
  readonly summary?: string
  readonly isSelected: boolean
}
