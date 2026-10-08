import { displayWidthOf } from './display-width-of.js'
import { ICON_COLUMNS } from './icon-columns.js'

/**
 * The spaces drawn after a row's glyph, so every headline starts in the same column whether the glyph takes one cell (⚠) or two (📦).
 *
 * @param icon the glyph, already fitted to `ICON_COLUMNS`
 */
export function iconGapOf(icon: string): string {
  return ' '.repeat(1 + Math.max(0, ICON_COLUMNS - displayWidthOf(icon)))
}
