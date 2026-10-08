import type { PaneTab } from './pane-tab.js'

/**
 * The text a tab draws: its name, then its count when it has one (`Saved 2`).
 *
 * @param tab the tab
 */
export function paneTabTextOf(tab: PaneTab): string {
  return tab.count === undefined ? tab.label : `${tab.label} ${tab.count}`
}
