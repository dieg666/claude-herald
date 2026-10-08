import type { SavedItem, Source } from '../../types/index.js'
import { httpUrlOf } from '../commands/http-url-of.js'
import { isStackItem } from '../deps/stack/is-stack-item.js'
import { stackNoteOf } from '../deps/stack/stack-note-of.js'
import { collapsedTextOf } from '../page/collapsed-text-of.js'
import { summaryTextOf } from '../summaries/summary-text-of.js'
import { ageColumnOf } from './age-column-of.js'
import { ageOf } from './age-of.js'
import type { BandModel } from './band-model.js'
import type { BandPage } from './band-page.js'
import { displayWidthOf } from './display-width-of.js'
import { fitColumns } from './fit-columns.js'
import { GROUP_GAP_COLUMNS } from './group-gap-columns.js'
import { LEAD_COLUMNS } from './lead-columns.js'
import { rangeLabelOf } from './range-label-of.js'
import { sourceHeadOf } from './source-head-of.js'

/**
 * Feed text as one line, invisible characters and line breaks gone.
 *
 * @param text untrusted text
 */
function lineOf(text: string): string {
  return collapsedTextOf(text).trim()
}

/** The fewest cells a stack row's inline note is drawn in, so a cut note keeps a few characters before its ellipsis. */
const INLINE_NOTE_MIN_COLUMNS = 4

/**
 * A stack row's note fitted after its headline on the same line, a gap between them; undefined when fewer than `INLINE_NOTE_MIN_COLUMNS` cells are left.
 *
 * @param note the ecosystem, level and flags
 * @param title the headline as fitted
 * @param room the cells the headline and the note share
 */
function inlineNoteOf(note: string, title: string, room: number): string | undefined {
  const left = room - displayWidthOf(title) - GROUP_GAP_COLUMNS

  return left < INLINE_NOTE_MIN_COLUMNS ? undefined : fitColumns(lineOf(note), left)
}

/**
 * What the full band draws for a page, every line fitted to `columns` cells: each row starts with a source column `SOURCE_COLUMNS` cells wide, so every headline and summary starts in one column; a news item's column holds its source's name (a factory source's short label) cut with `…` (blank when the source is gone), its title as stored, a bare version tag included since the column names the source; a stack item's column holds 📦 (⚠ when breaking or security) and the package (without its scope when too long), its headline `current → new` and its summary the ecosystem, level and flags; releases are marked so their label takes the release color; a news item without usable text, or with an empty summary (replies rejected for now), shows no summary; with automatic summaries off every row takes one line: no news summary or placeholder, a stack item's note after its headline; every row has an age column of `AGE_COLUMNS` cells after the source column, the item's age (`ageOf`) right-aligned in it, blank for an undated item, so headlines and summaries still start in one column.
 *
 * @param page the page shown
 * @param sources every source, for the names
 * @param summaries the one-line summaries by item id
 * @param saved the saved items
 * @param columns the cells the band's tree may take
 * @param autoSummaries whether one-line summaries are drawn, each row then taking a second line
 * @param now the clock in milliseconds since the epoch, for the ages
 */
export function bandModelOf(
  page: BandPage,
  sources: readonly Source[],
  summaries: Readonly<Record<string, string>>,
  saved: readonly SavedItem[],
  columns: number,
  autoSummaries: boolean,
  now: number,
): BandModel {
  const byId = new Map(sources.map(source => [source.id, source]))
  const selected = page.items[page.span.selected]
  const room = columns - LEAD_COLUMNS

  const rows = page.items.map((item, index) => {
    const stack = isStackItem(item) ? item : undefined
    const href = httpUrlOf(item.url)?.href
    const headline = sourceHeadOf(item, byId.get(item.sourceId), room)
    const row = {
      id: item.id,
      ...headline,
      age: ageColumnOf(ageOf(item.publishedAt, now)),
      ...(href === undefined ? {} : { href }),
      isSelected: index === page.span.selected,
    }

    if (!autoSummaries) {
      const note =
        stack === undefined
          ? undefined
          : inlineNoteOf(stackNoteOf(stack.release, stack.rollup), headline.title, room)

      return note === undefined ? row : { ...row, note }
    }

    const cached = Object.hasOwn(summaries, item.id) ? summaries[item.id] : undefined
    const hasNoSummary = stack === undefined && (cached === '' || summaryTextOf(item) === '')
    const summary =
      stack !== undefined
        ? stackNoteOf(stack.release, stack.rollup)
        : hasNoSummary
          ? undefined
          : cached

    return {
      ...row,
      ...(summary === undefined ? {} : { summary: fitColumns(lineOf(summary), room) }),
      ...(hasNoSummary ? { hasNoSummary: true as const } : {}),
    }
  })

  return {
    range: rangeLabelOf(page.span, page.total, '–'),
    isPaused: page.isPaused,
    rows,
    hasSummaries: autoSummaries,
    isSelectedSaved: selected !== undefined && saved.some(entry => entry.id === selected.id),
  }
}
