import { SAVED_TAB } from '../names/saved-tab.js'
import { STACK_TAB } from '../names/stack-tab.js'
import type { PaneTab } from './pane-tab.js'

/**
 * The count token a tab draws after its name, none for a tab without a count: new items as `•7` on a source tab and the All tab, a total as `(2)` on the stack and saved tabs, so the two read as different things.
 *
 * @param tab the tab
 */
export function paneTabCountTextOf(tab: PaneTab): string {
  if (tab.count === undefined) {
    return ''
  }

  return tab.id === STACK_TAB || tab.id === SAVED_TAB ? `(${tab.count})` : `•${tab.count}`
}
