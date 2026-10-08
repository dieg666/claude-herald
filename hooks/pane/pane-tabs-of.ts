import type { SavedItem, Source } from '../../types/index.js'
import { fitColumns } from '../band/fit-columns.js'
import { stackPackagesOf } from '../deps/stack/stack-packages-of.js'
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
 * The pane's tabs, each with its full name and the name cut to `PANE_TAB_COLUMNS` cells: one per enabled source in order (the first nine with the digits 1 to 9), then the stack tab on y with its packages behind when there is a stack, then the saved tab on 0 with its items; a source whose id is the saved tab's never gets a tab.
 *
 * @param sources every source, in order
 * @param stack the stack tab's items; no stack tab when absent
 * @param saved the saved items
 */
export function paneTabsOf(
  sources: readonly Source[],
  stack?: PaneStack,
  saved: readonly SavedItem[] = [],
): PaneTab[] {
  const tabs = sources
    .filter(source => source.isEnabled && source.id !== SAVED_TAB)
    .map((source, index) => {
      const label = collapsedTextOf(source.name).trim() || source.id

      return {
        id: source.id,
        label,
        short: fitColumns(label, PANE_TAB_COLUMNS),
        ...(index < 9 ? { hotkey: String(index + 1) } : {}),
      }
    })

  const stackTab =
    stack === undefined
      ? []
      : [
          {
            id: STACK_TAB,
            label: 'Your stack',
            short: 'Your stack',
            hotkey: PANE_HOTKEYS.stack,
            ...countOf(stackPackagesOf(stack.items).length),
          },
        ]

  return [
    ...tabs,
    ...stackTab,
    {
      id: SAVED_TAB,
      label: 'Saved',
      short: 'Saved',
      hotkey: PANE_HOTKEYS.saved,
      ...countOf(saved.length),
    },
  ]
}
