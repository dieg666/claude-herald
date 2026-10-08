import type { SavedItem, Source } from '../../types/index.js'
import { httpUrlOf } from '../commands/http-url-of.js'
import { isStackItem } from '../deps/stack/is-stack-item.js'
import { stackHeadlineOf } from '../deps/stack/stack-headline-of.js'
import { stackIconOf } from '../deps/stack/stack-icon-of.js'
import { stackNoteOf } from '../deps/stack/stack-note-of.js'
import { collapsedTextOf } from '../page/collapsed-text-of.js'
import { summaryTextOf } from '../summaries/summary-text-of.js'
import type { BandModel } from './band-model.js'
import type { BandPage } from './band-page.js'
import { fitColumns } from './fit-columns.js'
import { ICON_COLUMNS } from './icon-columns.js'
import { isReleaseNews } from './is-release-news.js'
import { LEAD_COLUMNS } from './lead-columns.js'
import { rangeLabelOf } from './range-label-of.js'
import { sourceColumnOf } from './source-column-of.js'
import { SOURCE_COLUMNS } from './source-columns.js'

/**
 * Feed text as one line, invisible characters and line breaks gone.
 *
 * @param text untrusted text
 */
function lineOf(text: string): string {
  return collapsedTextOf(text).trim()
}

/**
 * What the full band draws for a page, every line fitted to `columns` cells: each row starts with a source column `SOURCE_COLUMNS` cells wide, so every headline and summary starts in one column; a news item's column holds its source's name cut with `…` (blank when the source is gone), its title as stored, a bare version tag included since the column names the source; a stack item's column holds 📦 (⚠ when breaking or security) and the package, its headline `current → new` and its summary the ecosystem, level and flags; releases are marked so their label takes the release color; a news item without usable text, or with an empty summary (replies rejected for now), shows no summary.
 *
 * @param page the page shown
 * @param sources every source, for the names
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
  const byId = new Map(sources.map(source => [source.id, source]))
  const selected = page.items[page.span.selected]
  const room = columns - LEAD_COLUMNS

  const rows = page.items.map((item, index) => {
    const stack = isStackItem(item) ? item : undefined
    const href = httpUrlOf(item.url)?.href
    const cached = Object.hasOwn(summaries, item.id) ? summaries[item.id] : undefined
    const hasNoSummary = stack === undefined && (cached === '' || summaryTextOf(item) === '')
    const summary =
      stack !== undefined ? stackNoteOf(stack.release) : hasNoSummary ? undefined : cached
    const source = byId.get(item.sourceId)
    const title = lineOf(item.title)
    const headline =
      stack === undefined
        ? {
            ...sourceColumnOf(lineOf(source?.name ?? ''), SOURCE_COLUMNS),
            ...(isReleaseNews(title, source) ? { isRelease: true as const } : {}),
            title: fitColumns(title, room),
          }
        : {
            icon: fitColumns(stackIconOf(stack.release), ICON_COLUMNS),
            // The glyph and its gap take the glyph column and one cell more.
            ...sourceColumnOf(lineOf(stack.release.name), SOURCE_COLUMNS - ICON_COLUMNS - 1),
            isRelease: true as const,
            title: fitColumns(stackHeadlineOf(stack), room),
          }

    return {
      id: item.id,
      ...headline,
      ...(href === undefined ? {} : { href }),
      ...(summary === undefined ? {} : { summary: fitColumns(lineOf(summary), room) }),
      ...(hasNoSummary ? { hasNoSummary: true as const } : {}),
      isSelected: index === page.span.selected,
    }
  })

  return {
    range: rangeLabelOf(page.span, page.total, '–'),
    isPaused: page.isPaused,
    rows,
    isSelectedSaved: selected !== undefined && saved.some(entry => entry.id === selected.id),
  }
}
