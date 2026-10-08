import type { Item, Source } from '../../types/index.js'
import { sourceLabelOf } from '../defaults/source-label-of.js'
import { isStackItem } from '../deps/stack/is-stack-item.js'
import { stackHeadlineOf } from '../deps/stack/stack-headline-of.js'
import { stackItemIconOf } from '../deps/stack/stack-item-icon-of.js'
import { collapsedTextOf } from '../page/collapsed-text-of.js'
import { fitColumns } from './fit-columns.js'
import { ICON_COLUMNS } from './icon-columns.js'
import { isReleaseNews } from './is-release-news.js'
import { sourceColumnOf } from './source-column-of.js'
import { SOURCE_COLUMNS } from './source-columns.js'
import { stackLabelOf } from './stack-label-of.js'

/** The cells a stack row's package takes: the source column less the glyph and its gap. */
const PACKAGE_COLUMNS = SOURCE_COLUMNS - ICON_COLUMNS - 1

/**
 * Feed text as one line, invisible characters and line breaks gone.
 *
 * @param text untrusted text
 */
function lineOf(text: string): string {
  return collapsedTextOf(text).trim()
}

/**
 * The start of a row that names its source in a column `SOURCE_COLUMNS` cells wide, as the full band and the pane's All tab draw it: a news item's column holds its source's name (a factory source's short label) cut with `…` (blank when the source is gone) and its title as stored, a bare version tag included since the column names the source; a stack item's column holds 📦 (⚠ when breaking or security) and the package (without its scope when too long), its headline `current → new`; releases are marked so their label takes the release color; the headline is fitted to `room` cells.
 *
 * @param item the item
 * @param source its source, undefined when gone
 * @param room the cells the headline may take
 */
export function sourceHeadOf(
  item: Item,
  source: Source | undefined,
  room: number,
): {
  readonly icon?: string
  readonly source: string
  readonly sourceGap: string
  readonly isRelease?: true
  readonly title: string
} {
  if (isStackItem(item)) {
    return {
      icon: fitColumns(stackItemIconOf(item), ICON_COLUMNS),
      ...sourceColumnOf(stackLabelOf(lineOf(item.release.name), PACKAGE_COLUMNS), PACKAGE_COLUMNS),
      isRelease: true,
      title: fitColumns(stackHeadlineOf(item), room),
    }
  }

  const title = lineOf(item.title)

  return {
    ...sourceColumnOf(lineOf(sourceLabelOf(source)), SOURCE_COLUMNS),
    ...(isReleaseNews(title, source) ? { isRelease: true as const } : {}),
    title: fitColumns(title, room),
  }
}
