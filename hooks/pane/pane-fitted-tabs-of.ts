import { displayWidthOf } from '../band/display-width-of.js'
import { fitColumns } from '../band/fit-columns.js'
import type { PaneTab } from './pane-tab.js'
import { paneTabRowTextOf } from './pane-tab-row-text-of.js'
import { wrappedLinesOf } from './wrapped-lines-of.js'

/**
 * The tabs as the tab row draws them at `columns` cells (80 when not a number), each measured with its count token: names in full, each kept within one line, unless the names cut to `PANE_TAB_COLUMNS` take fewer lines; the active tab is laid out as wide as the others, so which tab is active never changes the choice, except that a source tab's new count clears when it is entered.
 *
 * @param tabs the tabs, with their names and their cut names
 * @param columns the cells across the pane's body
 */
export function paneFittedTabsOf(tabs: readonly PaneTab[], columns: number): PaneTab[] {
  const width = Number.isFinite(columns) ? columns : 80
  const full = tabs.map(tab => {
    const extra = displayWidthOf(paneTabRowTextOf(tab)) - displayWidthOf(tab.label)

    return { ...tab, label: fitColumns(tab.label, Math.max(1, width - extra)) }
  })
  const cut = tabs.map(tab => ({ ...tab, label: tab.short }))
  const linesOf = (row: readonly PaneTab[]) => wrappedLinesOf(row.map(paneTabRowTextOf), width)

  return linesOf(cut) < linesOf(full) ? cut : full
}
