import type { Source } from '../../types/index.js'

/**
 * Whether a source's items go on the band: it is enabled and not hidden from the band.
 *
 * @param source any source
 */
export function isBandSource(source: Source): boolean {
  return source.isEnabled && source.isOnBand !== false
}
