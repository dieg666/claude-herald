/**
 * One tab of the pane: a source's id and name, the stack tab or the saved tab, with its hotkey when it has one.
 */
export type PaneTab = {
  /** A source id, `@stack` or `saved`. */
  readonly id: string
  /** The name drawn on the tab, one line fitted to a tab's width. */
  readonly label: string
  /** `1` to `9` for the first nine sources, `y` for the stack tab, `0` for the saved tab, none past the ninth source. */
  readonly hotkey?: string
}
