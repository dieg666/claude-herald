import type { Version } from './version.js'

type Qualifier = Version['qualifiers'][number]

/** Words that, after the first qualifier, still mark a build before what precedes them (`1.0a1.dev1` < `1.0a1`, `1.0-RC1-SNAPSHOT` < `1.0-RC1`). */
const BELOW_WORDS = new Set(['dev', 'snapshot'])

/**
 * The order of a qualifier against nothing at the same place: at the start, nothing is the final release; later, nothing sorts first except before a dev or snapshot marker.
 *
 * @param qualifier the qualifier one side has
 * @param index where it is
 */
function againstNothing(qualifier: Qualifier, index: number): number {
  if (typeof qualifier === 'number') {
    // A leading number is a semver numeric pre-release, below the final release.
    return index === 0 ? -1 : 1
  }

  if (index === 0) {
    return Math.sign(qualifier.rank)
  }

  return BELOW_WORDS.has(qualifier.word) ? -1 : 1
}

/**
 * The order of two qualifiers at the same place, semver's rules where they apply: numbers numerically and below words, words by rank, then alphabetically.
 *
 * @param a one side's
 * @param b the other side's
 * @param index where they are
 */
function compareAt(a: Qualifier | undefined, b: Qualifier | undefined, index: number): number {
  if (a === undefined || b === undefined) {
    if (a === undefined && b === undefined) {
      return 0
    }

    return a === undefined ? -againstNothing(b as Qualifier, index) : againstNothing(a, index)
  }

  if (typeof a === 'number' || typeof b === 'number') {
    if (typeof a === 'number' && typeof b === 'number') {
      return Math.sign(a - b)
    }

    const word = (typeof a === 'number' ? b : a) as Exclude<Qualifier, number>
    const numberFirst = index === 0 || !BELOW_WORDS.has(word.word) ? -1 : 1

    return typeof a === 'number' ? numberFirst : -numberFirst
  }

  if (a.rank !== b.rank) {
    return Math.sign(a.rank - b.rank)
  }

  return a.word < b.word ? -1 : a.word > b.word ? 1 : 0
}

/**
 * Orders two versions: epoch, then release parts (missing parts are 0, so `1.0` equals `1.0.0`), then qualifiers.
 *
 * @param a one version
 * @param b the other
 * @returns below 0 when `a` is older, 0 when they are the same, above 0 when `a` is newer
 */
export function compareVersions(a: Version, b: Version): number {
  if (a.epoch !== b.epoch) {
    return Math.sign(a.epoch - b.epoch)
  }

  for (let index = 0; index < Math.max(a.release.length, b.release.length); index += 1) {
    const order = Math.sign((a.release[index] ?? 0) - (b.release[index] ?? 0))

    if (order !== 0) {
      return order
    }
  }

  for (let index = 0; index < Math.max(a.qualifiers.length, b.qualifiers.length); index += 1) {
    const order = compareAt(a.qualifiers[index], b.qualifiers[index], index)

    if (order !== 0) {
      return order
    }
  }

  return 0
}
