import type { Source } from '../../types/index.js'
import { displayWidthOf } from '../band/display-width-of.js'
import { PANE_FIRST_WINDOW } from './pane-first-window.js'
import { PANE_ROW_LINES } from './pane-row-lines.js'
import { paneTabsOf } from './pane-tabs-of.js'

/**
 * The widest action rows the pane draws, the saved tab's and the stack tab's, as the terminal spells plain Buttons: `<hotkey>: <label>`.
 */
const ACTION_ROWS = [
  ['o: Open', 's: Summarize', 'v: Saved', 'c: Copy for Claude', 'r: Mark as read'],
  ['o: Open', 's: Summarize', 'v: Saved', 'c: Copy for Claude', 'e: Hide releases'],
]

/**
 * The lines a row of labels takes when it wraps at `columns` cells, two cells between labels.
 *
 * @param labels the labels as drawn
 * @param columns the cells across
 */
function linesOf(labels: readonly string[], columns: number): number {
  let lines = 1
  let used = 0

  for (const label of labels) {
    const width = displayWidthOf(label)

    if (used > 0 && used + 2 + width > columns) {
      lines += 1
      used = width
    } else {
      used += (used > 0 ? 2 : 0) + width
    }
  }

  return lines
}

/**
 * How many items fit in the pane's body of `columns` by `bodyRows` once the tab row, the heading and the action row are drawn; at least one, `PANE_FIRST_WINDOW` when `bodyRows` is not a number, 80 columns taken when `columns` is not.
 *
 * @param sources every source, for the tab row
 * @param columns the cells across the body
 * @param bodyRows the rows the body has
 * @param hasStack whether the tab row holds the stack tab
 */
export function paneWindowSizeOf(
  sources: readonly Source[],
  columns: number,
  bodyRows: number,
  hasStack = false,
): number {
  if (!Number.isFinite(bodyRows)) {
    return PANE_FIRST_WINDOW
  }

  const width = Number.isFinite(columns) ? columns : 80
  const tabs = paneTabsOf(sources, hasStack).map(tab =>
    tab.hotkey === undefined ? tab.label : `${tab.hotkey}: ${tab.label}`,
  )
  const chrome =
    linesOf(tabs, width) + 1 + Math.max(...ACTION_ROWS.map(labels => linesOf(labels, width)))

  return Math.max(1, Math.floor((bodyRows - chrome) / PANE_ROW_LINES))
}
