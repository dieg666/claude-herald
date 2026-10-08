import type { Source } from '../../types/index.js'
import { httpUrlOf } from '../commands/http-url-of.js'
import { isStackItem } from '../deps/stack/is-stack-item.js'
import { stackIconOf } from '../deps/stack/stack-icon-of.js'
import { stackLineOf } from '../deps/stack/stack-line-of.js'
import { displayTitleOf } from '../items/display-title-of.js'
import { collapsedTextOf } from '../page/collapsed-text-of.js'
import type { BandPage } from './band-page.js'
import type { CompactBandModel } from './compact-band-model.js'
import { compactControlsColumnsOf } from './compact-controls-columns-of.js'
import { COMPACT_HEADLINE_MIN_COLUMNS } from './compact-headline-min-columns.js'
import { fitColumns } from './fit-columns.js'
import { GROUP_GAP_COLUMNS } from './group-gap-columns.js'
import { ICON_COLUMNS } from './icon-columns.js'

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
 * What the compact band draws for a page of one: the position as `13/156` and the item's headline cut to the room left beside the controls, or to the whole width on a row of its own; no source name, summary or actions; a release keeps its 📦 or ⚠.
 *
 * @param page the page shown, of one item
 * @param sources every source, for the name a bare version tag leads with
 * @param columns the cells the band's tree may take
 */
export function compactBandModelOf(
  page: BandPage,
  sources: readonly Source[],
  columns: number,
): CompactBandModel {
  const item = page.items[page.span.selected]
  const rowCount = rowCountOf(columns, page.total)
  const room =
    rowCount === 1 ? columns - compactControlsColumnsOf(page.total) - GROUP_GAP_COLUMNS : columns
  const name = sources.find(source => source.id === item?.sourceId)?.name
  const href = item === undefined ? undefined : httpUrlOf(item.url)?.href
  const stack = item !== undefined && isStackItem(item) ? item : undefined
  const headline =
    stack === undefined
      ? {
          title: fitColumns(
            displayTitleOf(
              collapsedTextOf(item?.title ?? '').trim(),
              name === undefined ? undefined : collapsedTextOf(name).trim(),
            ),
            room,
          ),
        }
      : {
          icon: fitColumns(stackIconOf(stack.release), ICON_COLUMNS),
          title: fitColumns(stackLineOf(stack), room - ICON_COLUMNS - 1),
        }

  return {
    position: `${page.total === 0 ? 0 : page.span.start + 1}/${page.total}`,
    isPaused: page.isPaused,
    headline: { id: item?.id ?? '', ...headline, ...(href === undefined ? {} : { href }) },
    rowCount,
  }
}
