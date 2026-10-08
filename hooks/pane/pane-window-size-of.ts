import type { SavedItem, Source } from '../../types/index.js'
import { fitColumns } from '../band/fit-columns.js'
import { ACTION_HOTKEYS } from '../names/action-hotkeys.js'
import { ACTION_LABELS } from '../names/action-labels.js'
import { PANE_HOTKEYS } from '../names/pane-hotkeys.js'
import { PANE_LABELS } from '../names/pane-labels.js'
import { paneFittedTabsOf } from './pane-fitted-tabs-of.js'
import { PANE_FIRST_WINDOW } from './pane-first-window.js'
import { PANE_FOCUS_HINT } from './pane-focus-hint.js'
import type { PaneKey } from './pane-key.js'
import type { PaneStack } from './pane-stack.js'
import { PANE_SUMMARY_LINES } from './pane-summary-lines.js'
import { PANE_TAB_KEYS } from './pane-tab-keys.js'
import { paneTabSpellingOf } from './pane-tab-spelling-of.js'
import { paneTabsOf } from './pane-tabs-of.js'
import { wrappedLinesOf } from './wrapped-lines-of.js'

/**
 * Each footer key at its widest, as the terminal spells a plain Button: `<hotkey>: <label>`.
 */
const KEY_SPELLINGS: Readonly<Record<PaneKey, string>> = {
  open: `${ACTION_HOTKEYS.open}: ${ACTION_LABELS.open}`,
  summarize: `${ACTION_HOTKEYS.summarize}: ${ACTION_LABELS.summarize}`,
  save: `${ACTION_HOTKEYS.save}: ${ACTION_LABELS.saved}`,
  copy: `${ACTION_HOTKEYS.copy}: ${ACTION_LABELS.copy}`,
  read: `${PANE_HOTKEYS.read}: ${PANE_LABELS.read}`,
  releases: `${PANE_HOTKEYS.releases}: ${PANE_LABELS.hideReleases}`,
}

/**
 * How many one-line items fit in the pane's body of `columns` by `bodyRows` once the tab row (every tab spelled as the terminal draws it, full or cut names as the row chooses, the active one included), the title line, the footer (the widest any tab draws, focus hint included, so giving the pane the keyboard never moves the window) and the selected item's summary lines are drawn; at least one, `PANE_FIRST_WINDOW` when `bodyRows` is not a number, 80 columns taken when `columns` is not.
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
  const hint = fitColumns(PANE_FOCUS_HINT, width)
  const footer = Math.max(
    ...Object.values(PANE_TAB_KEYS).flatMap(keys => {
      const spelled = keys.map(key => KEY_SPELLINGS[key])

      return [wrappedLinesOf(spelled, width), wrappedLinesOf([hint, ...spelled], width)]
    }),
  )
  const chrome = wrappedLinesOf(tabs, width) + 1 + footer

  return Math.max(1, Math.floor(bodyRows - chrome - PANE_SUMMARY_LINES))
}
