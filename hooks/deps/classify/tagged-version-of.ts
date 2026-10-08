import type { TaggedVersion } from './tagged-version.js'

/** A version token: optional `v`, optional epoch, a digit, then letters, digits and single separators, then build metadata. */
const VERSION = String.raw`[vV]?(?:\d+!)?\d(?:[._-]?[0-9A-Za-z])*(?:\+[0-9A-Za-z.-]*)?`

const AT = new RegExp(String.raw`^(@?[^@\s]+)@(${VERSION})$`)

const PATH = new RegExp(String.raw`^(\S+)/(${VERSION})$`)

const DASH = new RegExp(String.raw`^([A-Za-z][\w.-]*?)[-_](${VERSION})$`)

const WHOLE = new RegExp(String.raw`^${VERSION}$`)

const SEARCH = new RegExp(String.raw`(?:^|[^0-9A-Za-z.])(${VERSION})`, 'g')

/** Prefixes that say "this is a release" rather than naming a package. */
const GENERIC_WORDS = new Set([
  'alpha',
  'beta',
  'final',
  'hotfix',
  'latest',
  'patch',
  'rc',
  'release',
  'releases',
  'rel',
  'version',
  'ver',
  'v',
  'r',
  'tag',
  'stable',
])

/**
 * The version with underscores as its only separators read as dots (`8_4_0` to `8.4.0`).
 *
 * @param version the version as written
 */
function dottedOf(version: string): string {
  return /^[vV]?\d+(?:_\d+)+$/.test(version) ? version.replace(/_/g, '.') : version
}

/**
 * Whether a version found in a title looks like one rather than a stray number: it has a dot, a `v` prefix or is a date.
 *
 * @param version the version as written
 */
function looksLikeVersion(version: string): boolean {
  return /^[vV]\d|\.|^\d{4}-\d{1,2}-\d{1,2}/.test(version)
}

/**
 * The tagged version with its package, unless the prefix is a generic word or itself a version.
 *
 * @param prefix what precedes the version
 * @param version the version
 */
function namedOf(prefix: string, version: string): TaggedVersion {
  const last = prefix.split('/').pop() ?? prefix
  const isGeneric = GENERIC_WORDS.has(last.toLowerCase()) || /^[vV]?\d/.test(last)

  return isGeneric
    ? { version: dottedOf(version) }
    : { version: dottedOf(version), package: prefix }
}

/**
 * The version a single token names: `@scope/pkg@1.2.3`, `pkg@1.2.3`, `sdk/go/v1.2.3`, `name-1.2.3`, `release-1.2` or a bare version.
 *
 * @param token one word
 */
function tokenVersionOf(token: string): TaggedVersion | undefined {
  if (WHOLE.test(token)) {
    return { version: dottedOf(token) }
  }

  const named = AT.exec(token) ?? PATH.exec(token) ?? DASH.exec(token)

  return named?.[1] === undefined || named[2] === undefined
    ? undefined
    : namedOf(named[1], named[2])
}

/**
 * The version a release tag or title names, and the package when the tag names one: a whole tag (or a title's first word) in one of the tag forms, else the first version-like word of the text (`Release 1.2.3: notes`); in a title, only a version with a dot, a `v` prefix or a date counts (`Weekly update 12` names none); undefined when there is none.
 *
 * @param text a tag or a title
 * @param isTitle whether the text is a title rather than a tag
 */
export function taggedVersionOf(text: string, isTitle = false): TaggedVersion | undefined {
  const isAccepted = (found: TaggedVersion | undefined) =>
    found !== undefined && (!isTitle || looksLikeVersion(found.version))
  const trimmed = text.trim().slice(0, 300)
  const first = (trimmed.split(/\s+/)[0] ?? '').replace(/[:,;]+$/, '')
  const found = tokenVersionOf(first)

  if (isAccepted(found)) {
    return found
  }

  for (const match of trimmed.matchAll(SEARCH)) {
    const version = match[1] === undefined ? undefined : { version: dottedOf(match[1]) }

    if (isAccepted(version)) {
      return version
    }
  }

  return undefined
}
