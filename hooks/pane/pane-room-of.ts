import { PANE_FIRST_WINDOW } from './pane-first-window.js'

/**
 * A window size as a whole number of items, at least one; `PANE_FIRST_WINDOW` when the size is not a finite number.
 *
 * @param size how many items fit, as worked out
 */
export function paneRoomOf(size: number): number {
  return Number.isFinite(size) ? Math.max(1, Math.floor(size)) : PANE_FIRST_WINDOW
}
