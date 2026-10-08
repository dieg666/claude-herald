import type { PaneRow } from './pane-row.js'
import type { PaneTabView } from './pane-tab-view.js'

/**
 * Everything the pane draws, worked out from state: the tabs, the heading (the active tab's name and the window's position), the rows or what an empty tab says, whether the saved tab is active, the stack tab's filter and whether the selected item is saved.
 */
export type PaneModel = {
  readonly tabs: readonly PaneTabView[]
  readonly heading: string
  readonly rows: readonly PaneRow[]
  /** What an empty tab shows in place of rows. */
  readonly empty: string
  readonly isSavedTab: boolean
  /** The stack tab's filter, set exactly when the stack tab is active. */
  readonly filter?: string
  readonly isSelectedSaved: boolean
}
