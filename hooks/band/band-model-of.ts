import type { SavedItem, Source } from '../../types/index.js'
import { httpUrlOf } from '../commands/http-url-of.js'
import { isStackItem } from '../deps/stack/is-stack-item.js'
import { stackIconOf } from '../deps/stack/stack-icon-of.js'
import { stackLineOf } from '../deps/stack/stack-line-of.js'
import { stackNoteOf } from '../deps/stack/stack-note-of.js'
import { displayTitleOf } from '../items/display-title-of.js'
import { collapsedTextOf } from '../page/collapsed-text-of.js'
import { summaryTextOf } from '../summaries/summary-text-of.js'
import type { BandModel } from './band-model.js'
import type { BandPage } from './band-page.js'
import { fitColumns } from './fit-columns.js'
import { ICON_COLUMNS } from './icon-columns.js'
import { rangeLabelOf } from './range-label-of.js'
import { SUMMARY_INDENT } from './summary-indent.js'

/**
 * Feed text as one line, invisible characters and line breaks gone.
 *
 * @param text untrusted text
 */
function lineOf(text: string): string {
  return collapsedTextOf(text).trim()
}

/**
 * What the band draws for a page, every line fitted to `columns` cells; a title that is only a version leads with its source's name; a stack item shows 📦 (⚠ when breaking or security), `pkg current → new` and its ecosystem, level and flags; a news item without usable text, or with an empty summary (replies rejected for now), shows no summary.
 *
 * @param page the page shown
 * @param sources every source, for the glyphs and names
 * @param summaries the one-line summaries by item id
 * @param saved the saved items
 * @param columns the cells the band's tree may take
 */
export function bandModelOf(
  page: BandPage,
  sources: readonly Source[],
  summaries: Readonly<Record<string, string>>,
  saved: readonly SavedItem[],
  columns: number,
): BandModel {
  const icons = new Map(sources.map(source => [source.id, lineOf(source.icon)]))
  const names = new Map(sources.map(source => [source.id, lineOf(source.name)]))
  const selected = page.items[page.span.selected]

  const rows = page.items.map((item, index) => {
    const stack = isStackItem(item) ? item : undefined
    const icon = fitColumns(
      stack === undefined ? icons.get(item.sourceId) || '*' : stackIconOf(stack.release),
      ICON_COLUMNS,
    )
    const href = httpUrlOf(item.url)?.href
    const cached = Object.hasOwn(summaries, item.id) ? summaries[item.id] : undefined
    const hasNoSummary = stack === undefined && (cached === '' || summaryTextOf(item) === '')
    const summary =
      stack !== undefined ? stackNoteOf(stack.release) : hasNoSummary ? undefined : cached
    const title =
      stack === undefined
        ? displayTitleOf(lineOf(item.title), names.get(item.sourceId))
        : stackLineOf(stack)

    return {
      id: item.id,
      icon,
      title: fitColumns(title, columns - ICON_COLUMNS - 3),
      ...(href === undefined ? {} : { href }),
      ...(summary === undefined
        ? {}
        : { summary: fitColumns(lineOf(summary), columns - SUMMARY_INDENT) }),
      ...(hasNoSummary ? { hasNoSummary: true as const } : {}),
      isSelected: index === page.span.selected,
    }
  })

  return {
    range: rangeLabelOf(page.span, page.total),
    isPaused: page.isPaused,
    rows,
    isSelectedSaved: selected !== undefined && saved.some(entry => entry.id === selected.id),
  }
}
