import type { Source } from '../../types/index.js'
import { displayWidthOf } from '../band/display-width-of.js'
import { PANE_ROW_LINES } from './pane-row-lines.js'
import { paneTabsOf } from './pane-tabs-of.js'

/**
 * The widest action row the pane draws, as the terminal spells plain Buttons: `<hotkey>: <label>`.
 */
const ACTION_LABELS = [
  'o: Open',
  's: Summarize',
  'v: Saved',
  'c: Copy for Claude',
  'r: Mark as read',
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
 * How many items fit in the pane's body of `columns` by `bodyRows` once the tab row, the heading and the action row are drawn; at least one.
 *
 * @param sources every source, for the tab row
 * @param columns the cells across the body
 * @param bodyRows the rows the body has
 */
export function paneWindowSizeOf(
  sources: readonly Source[],
  columns: number,
  bodyRows: number,
): number {
  const tabs = paneTabsOf(sources).map(tab =>
    tab.hotkey === undefined ? tab.label : `${tab.hotkey}: ${tab.label}`,
  )
  const chrome = linesOf(tabs, columns) + 1 + linesOf(ACTION_LABELS, columns)

  return Math.max(1, Math.floor((bodyRows - chrome) / PANE_ROW_LINES))
}
