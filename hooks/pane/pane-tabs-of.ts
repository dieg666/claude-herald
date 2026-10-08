import type { Source } from '../../types/index.js'
import { fitColumns } from '../band/fit-columns.js'
import { PANE_HOTKEYS } from '../names/pane-hotkeys.js'
import { SAVED_TAB } from '../names/saved-tab.js'
import { collapsedTextOf } from '../page/collapsed-text-of.js'
import { PANE_TAB_COLUMNS } from './pane-tab-columns.js'
import type { PaneTab } from './pane-tab.js'

/**
 * The pane's tabs: one per enabled source in order (the first nine with the digits 1 to 9), then the saved tab on 0; a source whose id is the saved tab's never gets a tab.
 *
 * @param sources every source, in order
 */
export function paneTabsOf(sources: readonly Source[]): PaneTab[] {
  const tabs = sources
    .filter(source => source.isEnabled && source.id !== SAVED_TAB)
    .map((source, index) => ({
      id: source.id,
      label: fitColumns(collapsedTextOf(source.name).trim(), PANE_TAB_COLUMNS) || source.id,
      ...(index < 9 ? { hotkey: String(index + 1) } : {}),
    }))

  return [...tabs, { id: SAVED_TAB, label: 'Saved', hotkey: PANE_HOTKEYS.saved }]
}
