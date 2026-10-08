import type { Source } from '../../types/index.js'
import { httpUrlOf } from '../commands/http-url-of.js'
import { isStackItem } from '../deps/stack/is-stack-item.js'
import { stackIconOf } from '../deps/stack/stack-icon-of.js'
import { stackLineOf } from '../deps/stack/stack-line-of.js'
import { displayTitleOf } from '../items/display-title-of.js'
import { collapsedTextOf } from '../page/collapsed-text-of.js'
import { AGE_COLUMNS } from './age-columns.js'
import { AGE_GAP_COLUMNS } from './age-gap-columns.js'
import { ageOf } from './age-of.js'
import type { BandPage } from './band-page.js'
import type { CompactBandModel } from './compact-band-model.js'
import { compactControlsColumnsOf } from './compact-controls-columns-of.js'
import { COMPACT_HEADLINE_MIN_COLUMNS } from './compact-headline-min-columns.js'
import { displayWidthOf } from './display-width-of.js'
import { fitColumns } from './fit-columns.js'
import { GROUP_GAP_COLUMNS } from './group-gap-columns.js'
import { ICON_COLUMNS } from './icon-columns.js'
import { isReleaseNews } from './is-release-news.js'
import { SOURCE_COLUMNS } from './source-columns.js'
import { SOURCE_GAP_COLUMNS } from './source-gap-columns.js'
import { sourceLabelOf } from './source-label-of.js'

/**
 * Feed text as one line, invisible characters and line breaks gone.
 *
 * @param text untrusted text
 */
function lineOf(text: string): string {
  return collapsedTextOf(text).trim()
}

/** The room from which the compact band also draws an age: the source column, its gap, the age's column and its gap, and the headline's fewest cells. */
const AGE_ROOM_COLUMNS =
  SOURCE_COLUMNS + SOURCE_GAP_COLUMNS + AGE_COLUMNS + AGE_GAP_COLUMNS + COMPACT_HEADLINE_MIN_COLUMNS

/**
 * The rows the compact band takes at that width, from its controls at their widest, so they never change as it turns.
 *
 * @param columns the cells the band's tree may take
 * @param total how many items there are
 */
function rowCountOf(columns: number, total: number): 1 | 2 | 3 {
  const controls = compactControlsColumnsOf(total)

  if (columns >= controls + GROUP_GAP_COLUMNS + COMPACT_HEADLINE_MIN_COLUMNS) {
    return 1
  }

  return columns >= controls ? 2 : 3
}

/**
 * What the compact band draws for a page of one: the position as `13/156` and the item's headline cut to the room left beside the controls, or to the whole width on a row of its own; where that room holds the source column, its gap and the headline's fewest cells (by the width and the total only, so it never changes as the band turns), a news item's source name (a factory source's short label) cut to `SOURCE_COLUMNS` comes before its title, else a bare version tag leads with the name; no summary or actions; a release keeps its 📦 or ⚠; where that room also holds the headline's fewest cells and the age's column (again by the width and the total only), a dated item's age (`ageOf`) comes after the source name (after the glyph of a release of the stack) and the headline gives way to it.
 *
 * @param page the page shown, of one item
 * @param sources every source, for the names
 * @param columns the cells the band's tree may take
 * @param now the clock in milliseconds since the epoch, for the age
 */
export function compactBandModelOf(
  page: BandPage,
  sources: readonly Source[],
  columns: number,
  now: number,
): CompactBandModel {
  const item = page.items[page.span.selected]
  const rowCount = rowCountOf(columns, page.total)
  const room =
    rowCount === 1 ? columns - compactControlsColumnsOf(page.total) - GROUP_GAP_COLUMNS : columns
  const source = sources.find(entry => entry.id === item?.sourceId)
  const name = lineOf(source?.name ?? '')
  const title = lineOf(item?.title ?? '')
  const hasSourceRoom = room >= SOURCE_COLUMNS + SOURCE_GAP_COLUMNS + COMPACT_HEADLINE_MIN_COLUMNS
  const href = item === undefined ? undefined : httpUrlOf(item.url)?.href
  const stack = item !== undefined && isStackItem(item) ? item : undefined
  const label = fitColumns(lineOf(sourceLabelOf(source)), SOURCE_COLUMNS)
  const hasAgeRoom = hasSourceRoom && room >= AGE_ROOM_COLUMNS
  const age = hasAgeRoom && item !== undefined ? ageOf(item.publishedAt, now) : undefined
  const ageCells = age === undefined ? 0 : displayWidthOf(age) + AGE_GAP_COLUMNS
  const lead =
    stack !== undefined
      ? ICON_COLUMNS + 1
      : hasSourceRoom && label !== ''
        ? displayWidthOf(label) + SOURCE_GAP_COLUMNS
        : 0
  const headline =
    stack !== undefined
      ? {
          icon: fitColumns(stackIconOf(stack.release), ICON_COLUMNS),
          title: fitColumns(stackLineOf(stack), room - lead - ageCells),
        }
      : hasSourceRoom && label !== ''
        ? {
            source: label,
            ...(isReleaseNews(title, source) ? { isRelease: true as const } : {}),
            title: fitColumns(title, room - lead - ageCells),
          }
        : { title: fitColumns(displayTitleOf(title, name), room - ageCells) }

  return {
    position: `${page.total === 0 ? 0 : page.span.start + 1}/${page.total}`,
    isPaused: page.isPaused,
    headline: {
      id: item?.id ?? '',
      ...headline,
      ...(href === undefined ? {} : { href }),
      ...(age === undefined ? {} : { age }),
    },
    rowCount,
  }
}
