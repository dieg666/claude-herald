import type { Item } from '../../types/index.js'
import type { BandSpan } from '../band/band-span.js'
import type { PaneTab } from './pane-tab.js'

/**
 * What the pane shows now: its tabs, the active one, that tab's items, the window over them, and the selected item.
 */
export type PanePage = {
  readonly tabs: readonly PaneTab[]
  readonly tab: PaneTab
  /** Every item of the active tab, in its order. */
  readonly items: readonly Item[]
  /** The window shown: where it starts, how many items, and the selection within it. */
  readonly span: BandSpan
  /** The items inside the window. */
  readonly shown: readonly Item[]
  /** The selected index in `items`, 0 for an empty tab. */
  readonly selected: number
  /** How many items the window may show. */
  readonly size: number
}
