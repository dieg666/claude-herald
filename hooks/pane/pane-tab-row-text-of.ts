import { PANE_TAB_COUNT_GAP } from './pane-tab-count-gap.js'
import { paneTabCountTextOf } from './pane-tab-count-text-of.js'
import type { PaneTab } from './pane-tab.js'
import { paneTabSpellingOf } from './pane-tab-spelling-of.js'

/**
 * A tab as the terminal's tab row lays it out: its spelling, then its count token after `PANE_TAB_COUNT_GAP` cells; the text whose width the row's wrapping is measured on.
 *
 * @param tab the tab
 */
export function paneTabRowTextOf(tab: PaneTab): string {
  const count = paneTabCountTextOf(tab)

  return count === ''
    ? paneTabSpellingOf(tab)
    : `${paneTabSpellingOf(tab)}${' '.repeat(PANE_TAB_COUNT_GAP)}${count}`
}
