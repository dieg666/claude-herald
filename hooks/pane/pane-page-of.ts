import type { ItemsBySource, PaneState, SavedItem, Source } from '../../types/index.js'
import { SAVED_TAB } from '../names/saved-tab.js'
import type { PanePage } from './pane-page.js'
import { paneRoomOf } from './pane-room-of.js'
import { paneSpanOf } from './pane-span-of.js'
import { paneTabsOf } from './pane-tabs-of.js'

/**
 * The page a pane state shows: its tab, or the first when it names none, a disabled or a removed source (the selection then back at the top); the selection brought inside the list.
 *
 * @param pane the pane state
 * @param sources every source, in order
 * @param items the kept items by source id, newest first
 * @param saved the saved items
 * @param size how many items the window may show
 */
export function panePageOf(
  pane: PaneState,
  sources: readonly Source[],
  items: Readonly<ItemsBySource>,
  saved: readonly SavedItem[],
  size: number,
): PanePage {
  const tabs = paneTabsOf(sources)
  const tab = tabs.find(entry => entry.id === pane.tab) ?? tabs[0] ?? { id: SAVED_TAB, label: '' }

  const list =
    tab.id === SAVED_TAB ? saved : Object.hasOwn(items, tab.id) ? (items[tab.id] ?? []) : []

  const asked =
    tab.id === pane.tab && Number.isInteger(pane.selected) && pane.selected > 0 ? pane.selected : 0
  const selected = Math.min(asked, Math.max(0, list.length - 1))
  const span = paneSpanOf(selected, list.length, size)

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
