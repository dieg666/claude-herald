import { BAND_LABELS } from '../names/band-labels.js'
import { BAND_NAME } from '../names/band-name.js'
import { buttonColumnsOf } from './button-columns-of.js'
import { displayWidthOf } from './display-width-of.js'
import { GROUP_GAP_COLUMNS } from './group-gap-columns.js'

/**
 * The cells the header takes on one row at its widest for a list of `total` items: the name, the position with both numbers as long as the total, and the back, next and auto Buttons (the wider auto label) set apart by a margin.
 *
 * @param total how many items there are
 */
export function headerColumnsOf(total: number): number {
  const digits = '0'.repeat(String(total).length)
  const range = displayWidthOf(`${digits}–${digits} of ${total}`)
  const auto = Math.max(
    buttonColumnsOf(BAND_LABELS.autoRunning),
    buttonColumnsOf(BAND_LABELS.autoPaused),
  )
  const group =
    buttonColumnsOf(BAND_LABELS.prev) +
    buttonColumnsOf(BAND_LABELS.next) +
    auto +
    2 * GROUP_GAP_COLUMNS

  return displayWidthOf(BAND_NAME) + GROUP_GAP_COLUMNS + range + GROUP_GAP_COLUMNS * 2 + group
}
