import type { PaneState } from '../../types/index.js'
import type { PaneMove } from './pane-move.js'
import type { PanePage } from './pane-page.js'

/**
 * The pane state after a move: another tab starts at its top, the active one keeps its selection; up and down stop at the ends.
 *
 * @param page the page shown now
 * @param move what happened
 */
export function paneAfter(page: PanePage, move: PaneMove): PaneState {
  if (move === 'up') {
    return { tab: page.tab.id, selected: Math.max(0, page.selected - 1) }
  }

  if (move === 'down') {
    return {
      tab: page.tab.id,
      selected: Math.min(Math.max(0, page.items.length - 1), page.selected + 1),
    }
  }

  return { tab: move.tab, selected: move.tab === page.tab.id ? page.selected : 0 }
}
