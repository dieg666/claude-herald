import type { Item, SavedItem, Source } from '../../types/index.js'
import { displayWidthOf } from '../band/display-width-of.js'
import { fitColumns } from '../band/fit-columns.js'
import { ICON_COLUMNS } from '../band/icon-columns.js'
import { rangeLabelOf } from '../band/range-label-of.js'
import { SUMMARY_INDENT } from '../band/summary-indent.js'
import { httpUrlOf } from '../commands/http-url-of.js'
import { ECOSYSTEM_LABELS } from '../deps/stack/ecosystem-labels.js'
import { isStackItem } from '../deps/stack/is-stack-item.js'
import { stackIconOf } from '../deps/stack/stack-icon-of.js'
import { stackLineOf } from '../deps/stack/stack-line-of.js'
import { stackNoteOf } from '../deps/stack/stack-note-of.js'
import { SAVED_TAB } from '../names/saved-tab.js'
import { STACK_TAB } from '../names/stack-tab.js'
import { collapsedTextOf } from '../page/collapsed-text-of.js'
import { PANE_HEADING_RESERVE } from './pane-heading-reserve.js'
import type { PaneModel } from './pane-model.js'
import type { PanePage } from './pane-page.js'
import type { PaneRow } from './pane-row.js'
import { shortDateOf } from './short-date-of.js'

/**
 * Feed text as one line, invisible characters and line breaks gone.
 *
 * @param text untrusted text
 */
function lineOf(text: string): string {
  return collapsedTextOf(text).trim()
}

/**
 * One item as the pane draws it, every line fitted to `columns` cells; a stack item shows 📦 (⚠ when breaking or security), `pkg current → new` and its ecosystem, level and flags.
 *
 * @param item the item
 * @param icon its source's glyph, fitted
 * @param summary its one-line summary, when there is one
 * @param isSelected whether it is the selected item
 * @param columns the cells the pane's body has
 */
function rowOf(
  item: Item,
  icon: string,
  summary: string | undefined,
  isSelected: boolean,
  columns: number,
): PaneRow {
  const stack = isStackItem(item) ? item : undefined
  const glyph = stack === undefined ? icon : fitColumns(stackIconOf(stack.release), ICON_COLUMNS)
  const note = stack === undefined ? summary : stackNoteOf(stack.release)
  const href = httpUrlOf(item.url)?.href
  const date = shortDateOf(item.publishedAt)
  const dated = date === undefined ? 0 : displayWidthOf(date) + 1
  const title = stack === undefined ? lineOf(item.title) : stackLineOf(stack)

  return {
    id: item.id,
    icon: glyph,
    title: fitColumns(title, columns - ICON_COLUMNS - 3 - dated),
    ...(href === undefined ? {} : { href }),
    ...(note === undefined ? {} : { summary: fitColumns(lineOf(note), columns - SUMMARY_INDENT) }),
    ...(date === undefined ? {} : { date }),
    isSelected,
  }
}

/**
 * The stack tab's rows with the ecosystem heading on the first row of each group in the window.
 *
 * @param rows the rows shown
 * @param shown the items they draw
 * @param columns the cells the pane's body has
 */
function withHeadings(rows: PaneRow[], shown: readonly Item[], columns: number): PaneRow[] {
  return rows.map((row, index) => {
    const item = shown[index]
    const before = shown[index - 1]
    const ecosystem = item !== undefined && isStackItem(item) ? item.release.ecosystem : undefined
    const previous =
      before !== undefined && isStackItem(before) ? before.release.ecosystem : undefined

    return ecosystem === undefined || ecosystem === previous
      ? row
      : { ...row, heading: fitColumns(ECOSYSTEM_LABELS[ecosystem], columns) }
  })
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
 * What the pane draws for a page, every line fitted to `columns` cells; the stack tab adds its filter and a heading per ecosystem.
 *
 * @param page the page shown
 * @param sources every source, for the names and glyphs
 * @param summaries the one-line summaries by item id
 * @param saved the saved items
 * @param columns the cells the pane's body has
 * @param filter the stack tab's filter
 */
export function paneModelOf(
  page: PanePage,
  sources: readonly Source[],
  summaries: Readonly<Record<string, string>>,
  saved: readonly SavedItem[],
  columns: number,
  filter = '',
): PaneModel {
  const icons = new Map(sources.map(source => [source.id, lineOf(source.icon)]))
  const isSavedTab = page.tab.id === SAVED_TAB
  const isStackTab = page.tab.id === STACK_TAB
  const name = isSavedTab
    ? 'Saved'
    : isStackTab
      ? 'Your stack'
      : lineOf(sources.find(source => source.id === page.tab.id)?.name ?? page.tab.label)
  const selected = page.items[page.selected]

  const drawn = page.shown.map((item, index) =>
    rowOf(
      item,
      fitColumns(icons.get(item.sourceId) || '*', ICON_COLUMNS),
      Object.hasOwn(summaries, item.id) ? summaries[item.id] : undefined,
      index === page.span.selected,
      columns,
    ),
  )
  const rows = isStackTab ? withHeadings(drawn, page.shown, columns) : drawn

  const heading =
    page.items.length === 0 ? name : `${name} · ${rangeLabelOf(page.span, page.items.length)}`

  return {
    tabs: page.tabs.map(tab => ({ ...tab, isActive: tab.id === page.tab.id })),
    heading: fitColumns(heading, columns - PANE_HEADING_RESERVE),
    rows,
    empty: fitColumns(emptyOf(page.tab.id, name, filter), columns),
    isSavedTab,
    ...(isStackTab ? { filter } : {}),
    isSelectedSaved: selected !== undefined && saved.some(entry => entry.id === selected.id),
  }
}
