import { actionsColumnsOf } from './actions-columns-of.js'
import { headerColumnsOf } from './header-columns-of.js'

/**
 * Whether the band is drawn compact: its column is narrower than the full band's header or actions line at its widest (65 cells for the actions line), so the full band would wrap.
 *
 * @param columns the cells the band's tree may take
 * @param total how many items there are
 */
export function isCompactBand(columns: number, total: number): boolean {
  return columns < Math.max(headerColumnsOf(total), actionsColumnsOf())
}
