import type { DepsLevel, DepsToastLevel } from '../../types/index.js'

/**
 * Every show level, from the widest to the narrowest.
 */
export const DEPS_LEVELS: readonly DepsLevel[] = [
  'all',
  'minor+',
  'major+breaking+security',
  'breaking+security',
]

/**
 * Every toast level: the show levels, then none.
 */
export const DEPS_TOAST_LEVELS: readonly DepsToastLevel[] = [...DEPS_LEVELS, 'off']
