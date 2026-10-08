import type { IdsBySource, Item, SavedItem, Source } from '../../types/index.js'
import { fitColumns } from '../band/fit-columns.js'
import { ICON_COLUMNS } from '../band/icon-columns.js'
import { MARK_COLUMNS } from '../band/mark-columns.js'
import { newsHeadlineOf } from '../band/news-headline-of.js'
import { rangeLabelOf } from '../band/range-label-of.js'
import { SOURCE_COLUMNS } from '../band/source-columns.js'
import { SOURCE_GAP_COLUMNS } from '../band/source-gap-columns.js'
import { sourceHeadOf } from '../band/source-head-of.js'
import { SUMMARY_INDENT } from '../band/summary-indent.js'
import { httpUrlOf } from '../commands/http-url-of.js'
import { isStackItem } from '../deps/stack/is-stack-item.js'
import { stackIconOf } from '../deps/stack/stack-icon-of.js'
import { stackLineOf } from '../deps/stack/stack-line-of.js'
import { stackNoteOf } from '../deps/stack/stack-note-of.js'
import { ALL_TAB } from '../names/all-tab.js'
import { SAVED_TAB } from '../names/saved-tab.js'
import { STACK_TAB } from '../names/stack-tab.js'
import { collapsedTextOf } from '../page/collapsed-text-of.js'
import { summaryTextOf } from '../summaries/summary-text-of.js'
import { PANE_DATE_COLUMNS } from './pane-date-columns.js'
import { paneDateOf } from './pane-date-of.js'
import { paneFittedTabsOf } from './pane-fitted-tabs-of.js'
import { PANE_FOCUS_HINT } from './pane-focus-hint.js'
import { PANE_HEADING_RESERVE } from './pane-heading-reserve.js'
import type { PaneModel } from './pane-model.js'
import type { PanePage } from './pane-page.js'
import type { PaneRow } from './pane-row.js'
import { paneStackRowsOf } from './pane-stack-rows-of.js'
import { PANE_SUMMARY_LINES } from './pane-summary-lines.js'
import { PANE_TAB_KEYS } from './pane-tab-keys.js'
import { stateLineTextOf } from './state-line-text-of.js'
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
 * A news headline and its source name fitted to `columns` cells, the name cut first and dropped before the headline is, without the padding to the right end: the pane's layout puts the name before the date column.
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
 * A source column row's start as the pane's row spells it: the glyph, the column's label, its padding, the release mark and the headline.
 *
 * @param head the start as the band works it out
 */
function columnHeadOf(head: ReturnType<typeof sourceHeadOf>) {
  return {
    ...(head.icon === undefined ? {} : { icon: head.icon }),
    sourceColumn: head.source,
    sourceColumnGap: head.sourceGap,
    ...(head.isRelease === true ? { isRelease: true as const } : {}),
    title: head.title,
  }
}

/**
 * One item as the pane draws it, every line fitted to `columns` cells, the selected one with its summary wrapped onto at most `PANE_SUMMARY_LINES` lines; a news item has the source name after its headline when `sourceName` is given (the saved tab), before its date column; a stack item shows 📦 (⚠ when breaking or security), `pkg current → new` and its ecosystem, level and flags; with `column` (the All tab) every row starts with the band's source column instead (`sourceHeadOf`); a news item without usable text, with an empty summary (replies rejected for now), or with automatic summaries off, shows no summary.
 *
 * @param item the item
 * @param summary its one-line summary, when there is one
 * @param isSelected whether it is the selected item
 * @param columns the cells the pane's body has
 * @param autoSummaries whether a news item's one-line summary is drawn
 * @param sourceName the source's name when the tab mixes sources, drawn after the headline before the date, or leading a version-only title
 * @param isRead whether the item was opened or copied for Claude
 * @param column the item's source (undefined when gone) when the row starts with a source column
 * @param now the clock, for an item's age
 */
function rowOf(
  item: Item,
  summary: string | undefined,
  isSelected: boolean,
  columns: number,
  autoSummaries: boolean,
  sourceName: string | undefined,
  isRead: boolean,
  column: { readonly source: Source | undefined } | undefined,
  now: number,
): PaneRow {
  const stack = isStackItem(item) ? item : undefined
  const hasNoSummary =
    stack === undefined && (!autoSummaries || summary === '' || summaryTextOf(item) === '')
  const note = stack !== undefined ? stackNoteOf(stack.release) : hasNoSummary ? undefined : summary
  const href = httpUrlOf(item.url)?.href
  const date = paneDateOf(item.publishedAt, now)
  const dated = date === undefined ? 0 : PANE_DATE_COLUMNS + 1
  const headline =
    column !== undefined
      ? columnHeadOf(
          sourceHeadOf(
            item,
            column.source,
            columns - MARK_COLUMNS - SOURCE_COLUMNS - SOURCE_GAP_COLUMNS - dated,
          ),
        )
      : stack === undefined
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
    ...(isRead ? { isRead: true as const } : {}),
    isSelected,
  }
}

/**
 * What the pane draws for a page, every line fitted to `columns` cells: the tab's state line in place of rows on an empty tab, above them on a source whose refresh failed; a news item that was read is marked so; the All tab's rows start with the band's source column and take the news keys; on the saved tab a title that is only a version leads with its source's name; the stack tab draws a one-line row per package (and per release of an expanded one) under a heading per ecosystem, with its summary line and its filter; the footer holds the keys that act on the tab, after the focus hint while the pane does not hold the keyboard.
 *
 * @param page the page shown
 * @param sources every source, for the names
 * @param summaries the one-line summaries by item id
 * @param saved the saved items
 * @param columns the cells the pane's body has
 * @param autoSummaries whether the selected news item's one-line summary is drawn; a stack item's note is drawn either way
 * @param filter the stack tab's filter
 * @param isFocused whether the pane holds the keyboard
 * @param read the read item ids by source id
 * @param now the clock, in milliseconds since the epoch: an item less than a day old shows its age in the date column
 */
export function paneModelOf(
  page: PanePage,
  sources: readonly Source[],
  summaries: Readonly<Record<string, string>>,
  saved: readonly SavedItem[],
  columns: number,
  autoSummaries: boolean,
  filter = '',
  isFocused = true,
  read: Readonly<IdsBySource> = {},
  now: number,
): PaneModel {
  const names = new Map(sources.map(source => [source.id, lineOf(source.name)]))
  const byId = new Map(sources.map(source => [source.id, source]))
  const isAllTab = page.tab.id === ALL_TAB
  const isSavedTab = page.tab.id === SAVED_TAB
  const isStackTab = page.tab.id === STACK_TAB
  const selected = page.items[page.selected]

  const rows =
    page.stack === undefined
      ? page.shown.map((item, index) =>
          rowOf(
            item,
            Object.hasOwn(summaries, item.id) ? summaries[item.id] : undefined,
            index === page.span.selected,
            columns,
            autoSummaries,
            isSavedTab ? names.get(item.sourceId) : undefined,
            Object.hasOwn(read, item.sourceId) && read[item.sourceId]?.includes(item.id) === true,
            isAllTab ? { source: byId.get(item.sourceId) } : undefined,
            now,
          ),
        )
      : paneStackRowsOf(page.stack, page.span.selected, columns, now)
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
    ...(rows.length === 0 || page.stateLine === undefined
      ? {}
      : { notice: stateLineTextOf(page.stateLine, columns) }),
    rows,
    empty: page.stateLine === undefined ? '' : stateLineTextOf(page.stateLine, columns),
    keys,
    ...(isFocused || keys.length === 0 ? {} : { hint: fitColumns(PANE_FOCUS_HINT, columns) }),
    // A stack with nothing to filter draws no field over its state line.
    ...(isStackTab && (filter !== '' || (page.stack?.packages.length ?? 0) > 0) ? { filter } : {}),
    ...(page.stack === undefined || page.stack.summary === ''
      ? {}
      : { summary: fitColumns(page.stack.summary, columns) }),
    ...(selectedRow === undefined
      ? {}
      : { isExpanded: page.stack?.expanded.includes(selectedRow.pkg.key) === true }),
    isSelectedSaved: selected !== undefined && saved.some(entry => entry.id === selected.id),
  }
}
