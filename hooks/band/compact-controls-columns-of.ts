import { BAND_LABELS } from '../names/band-labels.js'
import { buttonColumnsOf } from './button-columns-of.js'
import { compactTitleColumnsOf } from './compact-title-columns-of.js'
import { GROUP_GAP_COLUMNS } from './group-gap-columns.js'

/**
 * The cells the compact band's name, position and back, next and auto Buttons take on one row at their widest (the wider auto label).
 *
 * @param total how many items there are
 */
export function compactControlsColumnsOf(total: number): number {
  const auto = Math.max(
    buttonColumnsOf(BAND_LABELS.autoRunning),
    buttonColumnsOf(BAND_LABELS.autoPaused),
  )
  const buttons =
    buttonColumnsOf(BAND_LABELS.prev) +
    buttonColumnsOf(BAND_LABELS.next) +
    auto +
    2 * GROUP_GAP_COLUMNS

  return compactTitleColumnsOf(total) + GROUP_GAP_COLUMNS + buttons
}
