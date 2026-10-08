import type { UiPressArgument } from 'claude-code'

import type { ACTION_HOTKEYS } from '../names/action-hotkeys.js'

/**
 * What each per-item action Button runs when pressed, by its element key; the band and the pane draw the same ones.
 */
export type ItemActionHandlers = {
  readonly [K in keyof typeof ACTION_HOTKEYS]: (press: UiPressArgument) => void
}
