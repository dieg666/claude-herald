/**
 * One item as the full band draws it: the source column (a news item's source name, or a release's glyph and package), the headline fitted to the width after it (a link when the address is http(s)), and the one-line summary when there is one and the item's age in the column after the source column; an item without usable text, or whose summary replies were rejected for now, has no summary line.
 */
export type BandRow = {
  readonly id: string
  /** The release glyph of a stack row, first in its source column; a news row has none. */
  readonly icon?: string
  /** The source column's label, cut to fit: the source's name, or a stack row's package; empty when the source is gone. */
  readonly source: string
  /** The spaces after `source` that fill the column and its gap, so every headline starts in one column. */
  readonly sourceGap: string
  /** Present, true, when the item is a release (a stack row, a release feed's item or a title that is only a version): its label takes the release color instead of dim. */
  readonly isRelease?: true
  readonly title: string
  /** The item's address, only when it is http(s). */
  readonly href?: string
  /** Undefined while the summary is pending, and when the row has none. */
  readonly summary?: string
  /** Present, true, when the item gets no summary line and no placeholder: it has no usable text, or its summary replies were rejected for now. */
  readonly hasNoSummary?: true
  /** A stack row's ecosystem, level and flags drawn dim after its headline, while rows take one line. */
  readonly note?: string
  /** The item's age as `ageOf` says it, right-aligned in the age column's cells, drawn dim after the source column; blank for an undated item. */
  readonly age: string
  readonly isSelected: boolean
}
