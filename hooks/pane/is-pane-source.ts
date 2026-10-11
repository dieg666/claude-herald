import type { Source } from '../../types/index.js'

/**
 * Whether a source shows in the pane, with a tab and its items in All: it is enabled and not hidden from the pane.
 *
 * @param source any source
 */
export function isPaneSource(source: Source): boolean {
  return source.isEnabled && source.isInPane !== false
}
