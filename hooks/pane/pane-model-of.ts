import type { Item, SavedItem, Source } from '../../types/index.js'
import { fitColumns } from '../band/fit-columns.js'
import { ICON_COLUMNS } from '../band/icon-columns.js'
import { MARK_COLUMNS } from '../band/mark-columns.js'
import { newsHeadlineOf } from '../band/news-headline-of.js'
import { rangeLabelOf } from '../band/range-label-of.js'
import { SUMMARY_INDENT } from '../band/summary-indent.js'
import { httpUrlOf } from '../commands/http-url-of.js'
import { isStackItem } from '../deps/stack/is-stack-item.js'
import { stackIconOf } from '../deps/stack/stack-icon-of.js'
import { stackLineOf } from '../deps/stack/stack-line-of.js'
import { stackNoteOf } from '../deps/stack/stack-note-of.js'
import { SAVED_TAB } from '../names/saved-tab.js'
import { STACK_TAB } from '../names/stack-tab.js'
import { collapsedTextOf } from '../page/collapsed-text-of.js'
import { summaryTextOf } from '../summaries/summary-text-of.js'
import { PANE_DATE_COLUMNS } from './pane-date-columns.js'
import { paneFittedTabsOf } from './pane-fitted-tabs-of.js'
import { PANE_FOCUS_HINT } from './pane-focus-hint.js'
import { PANE_HEADING_RESERVE } from './pane-heading-reserve.js'
import type { PaneModel } from './pane-model.js'
import type { PanePage } from './pane-page.js'
import type { PaneRow } from './pane-row.js'
import { paneStackRowsOf } from './pane-stack-rows-of.js'
import { PANE_SUMMARY_LINES } from './pane-summary-lines.js'
import { PANE_TAB_KEYS } from './pane-tab-keys.js'
import { shortDateOf } from './short-date-of.js'
import { wrapColumns } from './wrap-columns.js'

/**
 * Feed text as one line, invisible characters and line breaks gone.
 *
 * @param text untrusted text
 */
function lineOf(text: string): string {
  return collapsedTextOf(text).trim()
}

/**
 * A news headline and its source name fitted to `columns` cells as the band fits them, without the band's padding: the pane's layout puts the name before the date column.
 *
 * @param title the headline, one line
 * @param name the source's name, undefined to draw none
 * @param columns the cells the headline and the name may take together
 */
function newsLineOf(title: string, name: string | undefined, columns: number) {
  const line = newsHeadlineOf(title, name, columns)

  return { title: line.title, ...(line.source === undefined ? {} : { source: line.source }) }
}

/**
 * One item as the pane draws it, every line fitted to `columns` cells, the selected one with its summary wrapped onto at most `PANE_SUMMARY_LINES` lines; a news item has the source name after its headline when `sourceName` is given (the saved tab), before its date column; a stack item shows 📦 (⚠ when breaking or security), `pkg current → new` and its ecosystem, level and flags; a news item without usable text, or with an empty summary (replies rejected for now), shows no summary.
 *
 * @param item the item
 * @param summary its one-line summary, when there is one
 * @param isSelected whether it is the selected item
 * @param columns the cells the pane's body has
 * @param sourceName the source's name when the tab mixes sources, drawn after the headline before the date, or leading a version-only title
 */
function rowOf(
  item: Item,
  summary: string | undefined,
  isSelected: boolean,
  columns: number,
  sourceName?: string,
): PaneRow {
  const stack = isStackItem(item) ? item : undefined
  const hasNoSummary = stack === undefined && (summary === '' || summaryTextOf(item) === '')
  const note = stack !== undefined ? stackNoteOf(stack.release) : hasNoSummary ? undefined : summary
  const href = httpUrlOf(item.url)?.href
  const date = shortDateOf(item.publishedAt)
  const dated = date === undefined ? 0 : PANE_DATE_COLUMNS + 1
  const headline =
    stack === undefined
      ? newsLineOf(lineOf(item.title), sourceName, columns - MARK_COLUMNS - dated)
      : {
          icon: fitColumns(stackIconOf(stack.release), ICON_COLUMNS),
          title: fitColumns(stackLineOf(stack), columns - ICON_COLUMNS - 3 - dated),
        }

  return {
    id: item.id,
    ...headline,
    ...(href === undefined ? {} : { href }),
    ...(note === undefined || !isSelected
      ? {}
      : { summaryLines: wrapColumns(lineOf(note), columns - SUMMARY_INDENT, PANE_SUMMARY_LINES) }),
    ...(hasNoSummary ? { hasNoSummary: true as const } : {}),
    ...(date === undefined ? {} : { date }),
    isSelected,
  }
}

/**
 * What an empty tab says.
 *
 * @param tab which tab
 * @param name the tab's name
 * @param filter the stack tab's filter
 */
function emptyOf(tab: string, name: string, filter: string): string {
  if (tab === SAVED_TAB) {
    return 'Nothing saved yet: press v on an item to keep it here.'
  }

  if (tab === STACK_TAB) {
    return filter.trim() === ''
      ? 'No new release of your dependencies at this level.'
      : `No release matches "${lineOf(filter)}".`
  }

  return `Nothing from ${name} yet.`
}

/**
 * What the pane draws for a page, every line fitted to `columns` cells; on the saved tab a title that is only a version leads with its source's name; the stack tab draws a one-line row per package (and per release of an expanded one) under a heading per ecosystem, with its summary line and its filter; the footer holds the keys that act on the tab, after the focus hint while the pane does not hold the keyboard.
 *
 * @param page the page shown
 * @param sources every source, for the names
 * @param summaries the one-line summaries by item id
 * @param saved the saved items
 * @param columns the cells the pane's body has
 * @param filter the stack tab's filter
 * @param isFocused whether the pane holds the keyboard
 */
export function paneModelOf(
  page: PanePage,
  sources: readonly Source[],
  summaries: Readonly<Record<string, string>>,
  saved: readonly SavedItem[],
  columns: number,
  filter = '',
  isFocused = true,
): PaneModel {
  const names = new Map(sources.map(source => [source.id, lineOf(source.name)]))
  const isSavedTab = page.tab.id === SAVED_TAB
  const isStackTab = page.tab.id === STACK_TAB
  const name = isSavedTab
    ? 'Saved'
    : isStackTab
      ? 'Your stack'
      : lineOf(sources.find(source => source.id === page.tab.id)?.name ?? page.tab.label)
  const selected = page.items[page.selected]

  const rows =
    page.stack === undefined
      ? page.shown.map((item, index) =>
          rowOf(
            item,
            Object.hasOwn(summaries, item.id) ? summaries[item.id] : undefined,
            index === page.span.selected,
            columns,
            isSavedTab ? names.get(item.sourceId) : undefined,
          ),
        )
      : paneStackRowsOf(page.stack, page.span.selected, columns)
  const selectedRow = page.stack?.rows[page.selected]
  const keys =
    rows.length === 0 ? [] : PANE_TAB_KEYS[isSavedTab ? 'saved' : isStackTab ? 'stack' : 'news']

  return {
    tabs: paneFittedTabsOf(page.tabs, columns).map(tab => ({
      ...tab,
      isActive: tab.id === page.tab.id,
    })),
    ...(page.items.length === 0
      ? {}
      : {
          position: fitColumns(
            rangeLabelOf(page.span, page.items.length, '–'),
            columns - PANE_HEADING_RESERVE,
          ),
        }),
    rows,
    empty: fitColumns(emptyOf(page.tab.id, name, filter), columns),
    keys,
    ...(isFocused || keys.length === 0 ? {} : { hint: fitColumns(PANE_FOCUS_HINT, columns) }),
    ...(isStackTab ? { filter } : {}),
    ...(page.stack === undefined || page.stack.summary === ''
      ? {}
      : { summary: fitColumns(page.stack.summary, columns) }),
    ...(selectedRow === undefined
      ? {}
      : { isExpanded: page.stack?.expanded.includes(selectedRow.pkg.key) === true }),
    isSelectedSaved: selected !== undefined && saved.some(entry => entry.id === selected.id),
  }
}
