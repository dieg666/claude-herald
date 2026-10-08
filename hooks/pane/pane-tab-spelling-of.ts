import type { PaneTab } from './pane-tab.js'
import { paneTabTextOf } from './pane-tab-text-of.js'

/**
 * A tab as the terminal spells it, the way a plain Button reads: `<hotkey>: <text>`, the text alone without a hotkey.
 *
 * @param tab the tab
 */
export function paneTabSpellingOf(tab: PaneTab): string {
  const text = paneTabTextOf(tab)

  return tab.hotkey === undefined ? text : `${tab.hotkey}: ${text}`
}
