import type { Item } from '../../types/index.js'
import type { BandSpan } from '../band/band-span.js'
import type { PaneStackPage } from './pane-stack-page.js'
import type { PaneTab } from './pane-tab.js'

/**
 * What the pane shows now: its tabs, the active one, that tab's items, the window over them, and the selected item.
 */
export type PanePage = {
  readonly tabs: readonly PaneTab[]
  readonly tab: PaneTab
  /** Every item of the active tab, in its order; on the stack tab, the release each row acts on. */
  readonly items: readonly Item[]
  /** The window shown: where it starts, how many items, and the selection within it. */
  readonly span: BandSpan
  /** The items inside the window; on the stack tab, every release of the packages in it, whose flags the rows draw. */
  readonly shown: readonly Item[]
  /** The selected index in `items`, 0 for an empty tab. */
  readonly selected: number
  /** How many items the window may show, as given (the stack tab works it out in lines). */
  readonly size: number
  /** The stack tab's packages and rows, set exactly when the stack tab is active. */
  readonly stack?: PaneStackPage
}
