import type { Item, ItemsBySource, PaneState, SavedItem, Source } from '../../types/index.js'
import { stackTabItemsOf } from '../deps/stack/stack-tab-items-of.js'
import { SAVED_TAB } from '../names/saved-tab.js'
import { STACK_TAB } from '../names/stack-tab.js'
import type { PanePage } from './pane-page.js'
import { paneRoomOf } from './pane-room-of.js'
import { PANE_ROW_LINES } from './pane-row-lines.js'
import { paneSpanOf } from './pane-span-of.js'
import type { PaneStack } from './pane-stack.js'
import { paneTabsOf } from './pane-tabs-of.js'

/**
 * The page a pane state shows: its tab, or the first when it names none, a disabled or a removed source, or a stack tab that is gone (the selection then back at the top); the selection brought inside the list. The stack tab's window leaves room for its filter and its ecosystem headings.
 *
 * @param pane the pane state
 * @param sources every source, in order
 * @param items the kept items by source id, newest first
 * @param saved the saved items
 * @param size how many items the window may show
 * @param stack the stack tab's items and filter; no stack tab when absent
 */
export function panePageOf(
  pane: PaneState,
  sources: readonly Source[],
  items: Readonly<ItemsBySource>,
  saved: readonly SavedItem[],
  size: number,
  stack?: PaneStack,
): PanePage {
  const tabs = paneTabsOf(sources, stack !== undefined)
  const tab = tabs.find(entry => entry.id === pane.tab) ?? tabs[0] ?? { id: SAVED_TAB, label: '' }
  const stackList =
    tab.id === STACK_TAB && stack !== undefined
      ? stackTabItemsOf(stack.items, stack.filter)
      : undefined
  const list: readonly Item[] =
    stackList ??
    (tab.id === SAVED_TAB ? saved : Object.hasOwn(items, tab.id) ? (items[tab.id] ?? []) : [])

  const asked =
    tab.id === pane.tab && Number.isInteger(pane.selected) && pane.selected > 0 ? pane.selected : 0
  const selected = Math.min(asked, Math.max(0, list.length - 1))
  // The stack tab draws its filter and a heading per ecosystem besides its rows.
  const extraLines =
    stackList === undefined ? 0 : 1 + new Set(stackList.map(item => item.release.ecosystem)).size
  const room = Math.max(1, paneRoomOf(size) - Math.ceil(extraLines / PANE_ROW_LINES))
  const span = paneSpanOf(selected, list.length, room)

  return {
    tabs,
    tab,
    items: list,
    span,
    shown: list.slice(span.start, span.start + span.count),
    selected,
    size: paneRoomOf(size),
  }
}
