import type { PaneTab } from './pane-tab.js'

/**
 * A tab's name as the terminal spells it, the way a plain Button reads: `<hotkey>: <name>`, the name alone without a hotkey; the count token is not part of it.
 *
 * @param tab the tab
 */
export function paneTabSpellingOf(tab: PaneTab): string {
  return tab.hotkey === undefined ? tab.label : `${tab.hotkey}: ${tab.label}`
}
