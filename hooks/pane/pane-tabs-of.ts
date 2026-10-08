import type { SavedItem, Source } from '../../types/index.js'
import { fitColumns } from '../band/fit-columns.js'
import { sourceLabelOf } from '../defaults/source-label-of.js'
import { stackPackagesOf } from '../deps/stack/stack-packages-of.js'
import { ALL_TAB } from '../names/all-tab.js'
import { PANE_HOTKEYS } from '../names/pane-hotkeys.js'
import { SAVED_TAB } from '../names/saved-tab.js'
import { STACK_TAB } from '../names/stack-tab.js'
import { collapsedTextOf } from '../page/collapsed-text-of.js'
import type { PaneStack } from './pane-stack.js'
import { PANE_TAB_COLUMNS } from './pane-tab-columns.js'
import type { PaneTab } from './pane-tab.js'

/**
 * A count to draw on a tab, none for zero.
 *
 * @param count how many
 */
function countOf(count: number): { readonly count?: number } {
  return count > 0 ? { count } : {}
}

/**
 * The pane's tabs, each with its full name, its label (a factory source's short label while it keeps its factory name, else the source's own) and the label cut to `PANE_TAB_COLUMNS` cells: first the All tab on l with the new items it lists, then one per enabled source in order (the first nine with the digits 1 to 9) with its new items, then the stack tab on y with its packages behind when there is a stack, then the saved tab on 0 with its items; a source whose id is the saved tab's never gets a tab.
 *
 * @param sources every source, in order
 * @param stack the stack tab's items; no stack tab when absent
 * @param saved the saved items
 * @param newCounts how many new items each source has, by source id, and under the All tab's id how many the All tab lists
 */
export function paneTabsOf(
  sources: readonly Source[],
  stack?: PaneStack,
  saved: readonly SavedItem[] = [],
  newCounts: Readonly<Record<string, number>> = {},
): PaneTab[] {
  const tabs = sources
    .filter(source => source.isEnabled && source.id !== SAVED_TAB)
    .map((source, index) => {
      const name = collapsedTextOf(source.name).trim() || source.id
      const label = collapsedTextOf(sourceLabelOf(source)).trim() || source.id

      return {
        id: source.id,
        name,
        label,
        short: fitColumns(label, PANE_TAB_COLUMNS),
        ...(index < 9 ? { hotkey: String(index + 1) } : {}),
        ...countOf(Object.hasOwn(newCounts, source.id) ? (newCounts[source.id] ?? 0) : 0),
      }
    })

  const stackTab =
    stack === undefined
      ? []
      : [
          {
            id: STACK_TAB,
            name: 'Your stack',
            label: 'Your stack',
            short: 'Your stack',
            hotkey: PANE_HOTKEYS.stack,
            ...countOf(stackPackagesOf(stack.items).length),
          },
        ]

  const allTab = {
    id: ALL_TAB,
    name: 'All',
    label: 'All',
    short: 'All',
    hotkey: PANE_HOTKEYS.all,
    ...countOf(Object.hasOwn(newCounts, ALL_TAB) ? (newCounts[ALL_TAB] ?? 0) : 0),
  }

  return [
    allTab,
    ...tabs,
    ...stackTab,
    {
      id: SAVED_TAB,
      name: 'Saved',
      label: 'Saved',
      short: 'Saved',
      hotkey: PANE_HOTKEYS.saved,
      ...countOf(saved.length),
    },
  ]
}
