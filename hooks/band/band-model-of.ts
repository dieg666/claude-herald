import type { SavedItem, Source } from '../../types/index.js'
import { httpUrlOf } from '../commands/http-url-of.js'
import { isStackItem } from '../deps/stack/is-stack-item.js'
import { stackIconOf } from '../deps/stack/stack-icon-of.js'
import { stackLineOf } from '../deps/stack/stack-line-of.js'
import { stackNoteOf } from '../deps/stack/stack-note-of.js'
import { collapsedTextOf } from '../page/collapsed-text-of.js'
import type { BandModel } from './band-model.js'
import type { BandPage } from './band-page.js'
import { displayWidthOf } from './display-width-of.js'
import { fitColumns } from './fit-columns.js'
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
 * What the band draws for a page, every line fitted to `columns` cells; a stack item shows 📦 (⚠ when breaking or security), `pkg current → new` and its ecosystem, level and flags.
 *
 * @param page the page shown
 * @param sources every source, for the glyphs
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
  const selected = page.items[page.span.selected]

  const rows = page.items.map((item, index) => {
    const stack = isStackItem(item) ? item : undefined
    const icon = fitColumns(
      stack === undefined ? icons.get(item.sourceId) || '*' : stackIconOf(stack.release),
      2,
    )
    const href = httpUrlOf(item.url)?.href
    const summary =
      stack !== undefined
        ? stackNoteOf(stack.release)
        : Object.hasOwn(summaries, item.id)
          ? summaries[item.id]
          : undefined
    const title = stack === undefined ? lineOf(item.title) : stackLineOf(stack)

    return {
      id: item.id,
      icon,
      title: fitColumns(title, columns - displayWidthOf(icon) - 3),
      ...(href === undefined ? {} : { href }),
      ...(summary === undefined
        ? {}
        : { summary: fitColumns(lineOf(summary), columns - SUMMARY_INDENT) }),
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
