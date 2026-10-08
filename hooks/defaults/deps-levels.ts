import type { DepsLevel } from '../../types/index.js'

/**
 * Every show level, from the widest to the narrowest.
 */
export const DEPS_LEVELS: readonly DepsLevel[] = [
  'all',
  'minor+',
  'major+breaking+security',
  'breaking+security',
]
