import type { UiPressArgument } from 'claude-code'

import type { ItemActionHandlers } from '../actions/item-action-handlers.js'

/**
 * What each pane Button runs when pressed: a tab's (by the tab's id), the selection moves, mark-as-read, and the selected item's actions.
 */
export type PaneHandlers = ItemActionHandlers & {
  readonly tab: (id: string) => (press: UiPressArgument) => void
  readonly up: (press: UiPressArgument) => void
  readonly down: (press: UiPressArgument) => void
  readonly read: (press: UiPressArgument) => void
}
