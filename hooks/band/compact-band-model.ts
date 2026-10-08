/**
 * What the compact band draws, worked out from state: the position (`13/156`), whether rotation is paused, the one item's headline, and on how many rows it lays them out.
 */
export type CompactBandModel = {
  readonly position: string
  readonly isPaused: boolean
  readonly headline: CompactHeadline
  /** 1: everything on one line; 2: the headline on a row of its own; 3: the name and position, the Buttons and the headline each on a row. */
  readonly rowCount: 1 | 2 | 3
}

/**
 * The compact band's one item: its headline fitted to the room left (a link when the address is http(s)), with a release's glyph before it.
 */
export type CompactHeadline = {
  readonly id: string
  /** The release glyph of a stack item; a news item has none. */
  readonly icon?: string
  readonly title: string
  /** The item's address, only when it is http(s). */
  readonly href?: string
}
