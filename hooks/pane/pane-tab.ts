/**
 * One tab of the pane: a source's id and name, or the saved tab, with its digit hotkey when it has one.
 */
export type PaneTab = {
  /** A source id, or `saved`. */
  readonly id: string
  /** The name drawn on the tab, one line fitted to a tab's width. */
  readonly label: string
  /** `1` to `9` for the first nine sources, `0` for the saved tab, none past the ninth source. */
  readonly hotkey?: string
}
