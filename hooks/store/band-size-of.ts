import { DEFAULT_SETTINGS } from '../defaults/default-settings.js'
import { BAND_SIZE_BOUNDS } from './band-size-bounds.js'

/**
 * How many items the full band shows at once from a stored or held value: a whole number clamped to `BAND_SIZE_BOUNDS`, the default for anything else.
 *
 * @param value the stored or held size
 */
export function bandSizeOf(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value)
    ? Math.min(BAND_SIZE_BOUNDS.max, Math.max(BAND_SIZE_BOUNDS.min, value))
    : DEFAULT_SETTINGS.bandSize
}
