import { ACTION_LABELS } from '../names/action-labels.js'
import { BAND_LABELS } from '../names/band-labels.js'
import { buttonColumnsOf } from './button-columns-of.js'
import { GROUP_GAP_COLUMNS } from './group-gap-columns.js'

/**
 * The cells the actions line takes on one row at its widest: the four actions (Saved, the longer save label) then the up and down Buttons set apart by a margin. Narrower, it takes two rows.
 */
export function actionsColumnsOf(): number {
  const actions =
    buttonColumnsOf(ACTION_LABELS.open) +
    buttonColumnsOf(ACTION_LABELS.summarize) +
    Math.max(buttonColumnsOf(ACTION_LABELS.save), buttonColumnsOf(ACTION_LABELS.saved)) +
    buttonColumnsOf(ACTION_LABELS.copy) +
    3 * GROUP_GAP_COLUMNS
  const group =
    buttonColumnsOf(BAND_LABELS.up) + buttonColumnsOf(BAND_LABELS.down) + GROUP_GAP_COLUMNS

  return actions + GROUP_GAP_COLUMNS * 2 + group
}
