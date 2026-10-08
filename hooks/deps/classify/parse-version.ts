import type { Ecosystem } from '../../../types/index.js'
import { QUALIFIER_RANKS } from './qualifier-ranks.js'
import type { Version } from './version.js'

/** Qualifier words that name the final release itself and change nothing in the order. */
const FINAL_WORDS = new Set(['final', 'ga', 'release', 'stable'])

/** A calendar date at the start of a version: `2025-11-25`, `2025-11`. */
const DATE = /^((?:19|20)\d{2})-(\d{1,2})(?:-(\d{1,2}))?(?!\d)/

/**
 * The release parts at the start of a version: a dotted number list, or a date's year, month and day.
 *
 * @param text the version after its `v` and epoch
 */
function releaseOf(text: string): { parts: number[]; length: number } | undefined {
  const date = DATE.exec(text)
  const month = Number(date?.[2])
  const day = date?.[3] === undefined ? 1 : Number(date[3])

  if (date !== null && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
    const parts = [date[1], date[2], date[3]].flatMap(part =>
      part === undefined ? [] : [Number(part)],
    )

    return { parts, length: date[0].length }
  }

  const plain = /^\d+(?:\.\d+)*/.exec(text)

  return plain === null
    ? undefined
    : { parts: plain[0].split('.').map(Number), length: plain[0].length }
}

/**
 * A qualifier word's rank; an unknown word sorts after the final release for Maven (as its own ordering does), before it elsewhere (as semver pre-releases do).
 *
 * @param word the lowercased word
 * @param ecosystem the package's
 */
function rankOf(word: string, ecosystem?: Ecosystem): number {
  const known = Object.hasOwn(QUALIFIER_RANKS, word) ? QUALIFIER_RANKS[word] : undefined

  return known ?? (ecosystem === 'maven' ? 2 : -5)
}

/**
 * Parses a version of any supported scheme: semver (`v1.2.3-rc.1+build`), PEP 440 (`1!2.0rc1.post1.dev2`), calendar (`2024.10.1`, `2025-11-25-RC`), Go (`v2.1.0`, pseudo-versions) and Maven (`1.0-SNAPSHOT`, `5.3.31.RELEASE`, `2.0-M1`); build metadata and local labels after `+` are ignored; undefined when it does not start with a number.
 *
 * @param text the version as written
 * @param ecosystem decides what a bare number after the release means (a post release for PyPI and Maven, a pre-release elsewhere) and where an unknown word sorts (after the final release for Maven, before it elsewhere)
 */
export function parseVersion(text: string, ecosystem?: Ecosystem): Version | undefined {
  const body = text
    .trim()
    .replace(/^[vV](?=\d)/, '')
    .replace(/\+.*$/s, '')
  const epoch = /^(\d+)!/.exec(body)
  const rest = epoch === null ? body : body.slice(epoch[0].length)
  const release = releaseOf(rest)
  const tail = release === undefined ? '' : rest.slice(release.length)

  if (release === undefined || !/^[0-9A-Za-z._-]*$/.test(tail)) {
    return undefined
  }

  const isPostNumbered = ecosystem === 'pypi' || ecosystem === 'maven'
  const tokens = tail
    .toLowerCase()
    .split(/[._-]+/)
    .flatMap(piece => piece.match(/\d+|[a-z]+/g) ?? [])
    .filter(token => !FINAL_WORDS.has(token))
    .map(token =>
      /^\d/.test(token) ? Number(token) : { word: token, rank: rankOf(token, ecosystem) },
    )

  // PEP 440 (`1.0-1`) and Maven read a bare number after the release as a post release.
  const qualifiers =
    isPostNumbered && typeof tokens[0] === 'number'
      ? [{ word: 'post', rank: rankOf('post') }, ...tokens]
      : tokens

  return { epoch: epoch === null ? 0 : Number(epoch[1]), release: release.parts, qualifiers }
}
