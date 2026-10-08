import type { DepsToastLevel } from '../../types/index.js'
import { DEPS_LEVELS } from './deps-levels.js'

/**
 * Every toast level: the show levels, then none.
 */
export const DEPS_TOAST_LEVELS: readonly DepsToastLevel[] = [...DEPS_LEVELS, 'off']
