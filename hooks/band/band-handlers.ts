import type { UiPressArgument } from 'claude-code'

import type { ACTION_HOTKEYS } from '../names/action-hotkeys.js'
import type { BAND_HOTKEYS } from '../names/band-hotkeys.js'

/**
 * What each band Button runs when pressed, by its element key: the page and selection controls and the selected item's actions.
 */
export type BandHandlers = {
  readonly [K in keyof typeof BAND_HOTKEYS | keyof typeof ACTION_HOTKEYS]: (
    press: UiPressArgument,
  ) => void
}
