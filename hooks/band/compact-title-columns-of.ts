import { BAND_NAME } from '../names/band-name.js'
import { COMPACT_GAP_COLUMNS } from './compact-gap-columns.js'
import { displayWidthOf } from './display-width-of.js'

/**
 * The cells the compact band's name and position take at their widest for a list of `total` items: `Herald 156/156`.
 *
 * @param total how many items there are
 */
export function compactTitleColumnsOf(total: number): number {
  return displayWidthOf(BAND_NAME) + COMPACT_GAP_COLUMNS + 2 * String(total).length + 1
}
