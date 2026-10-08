/**
 * One tab of the pane: a source's id and name, the stack tab or the saved tab, with its hotkey when it has one and its count when it has a nonzero one.
 */
export type PaneTab = {
  /** A source id, `@stack` or `saved`. */
  readonly id: string
  /** The source's full name, for prose; the stack and saved tabs' own name. */
  readonly name: string
  /** The name drawn on the tab, one line: a source's short label or own name. */
  readonly label: string
  /** The name cut to `PANE_TAB_COLUMNS` cells, drawn instead when that takes fewer lines of tabs. */
  readonly short: string
  /** `1` to `9` for the first nine sources, `y` for the stack tab, `0` for the saved tab, none past the ninth source. */
  readonly hotkey?: string
  /** A source tab's new items, the stack tab's packages behind or the saved tab's items, drawn after the name; absent when zero. */
  readonly count?: number
}
