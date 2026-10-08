import type { Item, ItemsBySource, PaneState, SavedItem, Source } from '../../types/index.js'
import { stackPackagesOf } from '../deps/stack/stack-packages-of.js'
import { stackRowItemOf } from '../deps/stack/stack-row-item-of.js'
import { stackRowsOf } from '../deps/stack/stack-rows-of.js'
import { stackSummaryOf } from '../deps/stack/stack-summary-of.js'
import { stackTabPackagesOf } from '../deps/stack/stack-tab-packages-of.js'
import { SAVED_TAB } from '../names/saved-tab.js'
import { STACK_TAB } from '../names/stack-tab.js'
import type { PanePage } from './pane-page.js'
import { paneRoomOf } from './pane-room-of.js'
import { PANE_ROW_LINES } from './pane-row-lines.js'
import { paneSpanOf } from './pane-span-of.js'
import type { PaneStack } from './pane-stack.js'
import type { PaneStackPage } from './pane-stack-page.js'
import { paneTabsOf } from './pane-tabs-of.js'

/**
 * Every release of the packages in the window, each once, in order.
 *
 * @param stack the stack tab's page
 */
function releasesShownOf(stack: Omit<PaneStackPage, 'summary'>): Item[] {
  const byId = new Map<string, Item>()

  for (const row of stack.shownRows) {
    for (const item of row.kind === 'package' ? row.pkg.releases : [row.item]) {
      byId.set(item.id, item)
    }
  }

  return [...byId.values()]
}

/**
 * The page a pane state shows: its tab, or the first when it names none, a disabled or a removed source, or a stack tab that is gone (the selection then back at the top); the selection brought inside the list. The stack tab lists a one-line row per package and per release of an expanded package, in a window of lines that leaves room for its summary, its filter and its ecosystem headings.
 *
 * @param pane the pane state
 * @param sources every source, in order
 * @param items the kept items by source id, newest first
 * @param saved the saved items
 * @param size how many items the window may show
 * @param stack the stack tab's items, filter and expanded packages; no stack tab when absent
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
  const isStack = tab.id === STACK_TAB && stack !== undefined
  const packages = isStack ? stackTabPackagesOf(stack.items, stack.filter) : []
  const rows = isStack ? stackRowsOf(packages, stack.expanded) : []
  const list: readonly Item[] = isStack
    ? rows.map(stackRowItemOf)
    : tab.id === SAVED_TAB
      ? saved
      : Object.hasOwn(items, tab.id)
        ? (items[tab.id] ?? [])
        : []

  const asked =
    tab.id === pane.tab && Number.isInteger(pane.selected) && pane.selected > 0 ? pane.selected : 0
  const selected = Math.min(asked, Math.max(0, list.length - 1))
  const summary = isStack ? stackSummaryOf(stackPackagesOf(stack.items)) : ''
  // A stack row takes one line; the tab also draws its summary, its filter and a heading per ecosystem.
  const extraLines = (summary === '' ? 0 : 1) + 1 + new Set(packages.map(pkg => pkg.ecosystem)).size
  const room = isStack
    ? Math.max(1, paneRoomOf(size) * PANE_ROW_LINES - extraLines)
    : paneRoomOf(size)
  const span = paneSpanOf(selected, list.length, room)
  const window = list.slice(span.start, span.start + span.count)

  if (!isStack) {
    return { tabs, tab, items: list, span, shown: window, selected, size: paneRoomOf(size) }
  }

  const page = {
    packages,
    rows,
    shownRows: rows.slice(span.start, span.start + span.count),
    expanded: stack.expanded,
  }

  return {
    tabs,
    tab,
    items: list,
    span,
    shown: releasesShownOf(page),
    selected,
    size: paneRoomOf(size),
    stack: { ...page, summary },
  }
}
