import type { PaneRow } from './pane-row.js'
import type { PaneTabView } from './pane-tab-view.js'

/**
 * Everything the pane draws, worked out from state: the tabs, the window's position, the rows or what an empty tab says, whether the saved tab is active, the stack tab's summary, filter and whether its selected package is expanded, and whether the selected item is saved.
 */
export type PaneModel = {
  readonly tabs: readonly PaneTabView[]
  /** Where the window is in the active tab, `1–14 of 14`, drawn at the right end of the title line; absent on an empty tab. */
  readonly position?: string
  readonly rows: readonly PaneRow[]
  /** What an empty tab shows in place of rows. */
  readonly empty: string
  readonly isSavedTab: boolean
  /** The stack tab's filter, set exactly when the stack tab is active. */
  readonly filter?: string
  /** The stack tab's line under the heading, `5 packages behind · 1 security`; absent with no package. */
  readonly summary?: string
  /** On the stack tab with a row selected: whether its package lists its releases. */
  readonly isExpanded?: boolean
  readonly isSelectedSaved: boolean
}
