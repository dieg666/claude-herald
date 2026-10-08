import type { StackRelease } from '../../../types/index.js'

/**
 * Each release level by how far it moves from the version in use, the furthest first.
 */
export const LEVEL_RANKS: Readonly<Record<StackRelease['level'], number>> = {
  major: 0,
  minor: 1,
  patch: 2,
  unknown: 3,
}
