import type { PaneTab } from './pane-tab.js'

/**
 * One tab as drawn, marked when it is the active one.
 */
export type PaneTabView = PaneTab & {
  readonly isActive: boolean
}
