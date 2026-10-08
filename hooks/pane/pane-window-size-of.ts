import type { SavedItem, Source } from '../../types/index.js'
import { paneFittedTabsOf } from './pane-fitted-tabs-of.js'
import { PANE_FIRST_WINDOW } from './pane-first-window.js'
import type { PaneStack } from './pane-stack.js'
import { PANE_SUMMARY_LINES } from './pane-summary-lines.js'
import { paneTabSpellingOf } from './pane-tab-spelling-of.js'
import { paneTabsOf } from './pane-tabs-of.js'
import { wrappedLinesOf } from './wrapped-lines-of.js'

/**
 * The widest action rows the pane draws, the saved tab's and the stack tab's, as the terminal spells plain Buttons: `<hotkey>: <label>`.
 */
const ACTION_ROWS = [
  ['o: Open', 's: Summarize', 'v: Saved', 'c: Copy for Claude', 'r: Mark as read'],
  ['o: Open', 's: Summarize', 'v: Saved', 'c: Copy for Claude', 'e: Hide releases'],
]

/**
 * How many one-line items fit in the pane's body of `columns` by `bodyRows` once the tab row (every tab spelled as the terminal draws it, full or cut names as the row chooses, the active one included), the title line, the action row and the selected item's summary lines are drawn; at least one, `PANE_FIRST_WINDOW` when `bodyRows` is not a number, 80 columns taken when `columns` is not.
 *
 * @param sources every source, for the tab row
 * @param columns the cells across the body
 * @param bodyRows the rows the body has
 * @param stack the stack tab's items, for its tab and count; no stack tab when absent
 * @param saved the saved items, for the saved tab's count
 */
export function paneWindowSizeOf(
  sources: readonly Source[],
  columns: number,
  bodyRows: number,
  stack?: PaneStack,
  saved: readonly SavedItem[] = [],
): number {
  if (!Number.isFinite(bodyRows)) {
    return PANE_FIRST_WINDOW
  }

  const width = Number.isFinite(columns) ? columns : 80
  const tabs = paneFittedTabsOf(paneTabsOf(sources, stack, saved), width).map(paneTabSpellingOf)
  const chrome =
    wrappedLinesOf(tabs, width) +
    1 +
    Math.max(...ACTION_ROWS.map(labels => wrappedLinesOf(labels, width)))

  return Math.max(1, Math.floor(bodyRows - chrome - PANE_SUMMARY_LINES))
}
