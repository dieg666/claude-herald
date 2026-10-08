import type { Item, SavedItem, Source } from '../../types/index.js'
import { displayWidthOf } from '../band/display-width-of.js'
import { fitColumns } from '../band/fit-columns.js'
import { rangeLabelOf } from '../band/range-label-of.js'
import { SUMMARY_INDENT } from '../band/summary-indent.js'
import { httpUrlOf } from '../commands/http-url-of.js'
import { SAVED_TAB } from '../names/saved-tab.js'
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
 * One item as the pane draws it, every line fitted to `columns` cells.
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
  const href = httpUrlOf(item.url)?.href
  const date = shortDateOf(item.publishedAt)
  const dated = date === undefined ? 0 : displayWidthOf(date) + 1

  return {
    id: item.id,
    icon,
    title: fitColumns(lineOf(item.title), columns - displayWidthOf(icon) - 3 - dated),
    ...(href === undefined ? {} : { href }),
    ...(summary === undefined
      ? {}
      : { summary: fitColumns(lineOf(summary), columns - SUMMARY_INDENT) }),
    ...(date === undefined ? {} : { date }),
    isSelected,
  }
}

/**
 * What the pane draws for a page, every line fitted to `columns` cells.
 *
 * @param page the page shown
 * @param sources every source, for the names and glyphs
 * @param summaries the one-line summaries by item id
 * @param saved the saved items
 * @param columns the cells the pane's body has
 */
export function paneModelOf(
  page: PanePage,
  sources: readonly Source[],
  summaries: Readonly<Record<string, string>>,
  saved: readonly SavedItem[],
  columns: number,
): PaneModel {
  const icons = new Map(sources.map(source => [source.id, lineOf(source.icon)]))
  const isSavedTab = page.tab.id === SAVED_TAB
  const name = isSavedTab
    ? 'Saved'
    : lineOf(sources.find(source => source.id === page.tab.id)?.name ?? page.tab.label)
  const selected = page.items[page.selected]

  const rows = page.shown.map((item, index) =>
    rowOf(
      item,
      fitColumns(icons.get(item.sourceId) || '*', 2),
      Object.hasOwn(summaries, item.id) ? summaries[item.id] : undefined,
      index === page.span.selected,
      columns,
    ),
  )

  const heading =
    page.items.length === 0 ? name : `${name} · ${rangeLabelOf(page.span, page.items.length)}`

  return {
    tabs: page.tabs.map(tab => ({ ...tab, isActive: tab.id === page.tab.id })),
    heading: fitColumns(heading, columns - PANE_HEADING_RESERVE),
    rows,
    empty: fitColumns(
      isSavedTab
        ? 'Nothing saved yet: press v on an item to keep it here.'
        : `Nothing from ${name} yet.`,
      columns,
    ),
    isSavedTab,
    isSelectedSaved: selected !== undefined && saved.some(entry => entry.id === selected.id),
  }
}
