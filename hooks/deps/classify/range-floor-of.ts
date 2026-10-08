import type { Ecosystem } from '../../../types/index.js'
import { compareVersions } from './compare-versions.js'
import { parseVersion } from './parse-version.js'

/** Operators whose version is a lower bound (none means caret for Cargo, exact elsewhere: a floor either way). */
const LOWER = /^(?:>=|>|~>|~=|===|==|=|\^|~)?\s*/

/**
 * A version with its wildcard parts cut (`1.2.x` to `1.2`), undefined when nothing is left.
 *
 * @param text one comparator's version
 */
function withoutWildcards(text: string): string | undefined {
  const parts = text.split('.')
  const wild = parts.findIndex(part => /^[xX*]$/.test(part))
  const kept = wild === -1 ? parts : parts.slice(0, wild)

  return kept.length === 0 ? undefined : kept.join('.')
}

/**
 * The lower bound one alternative of a range sets, the highest of its comparators'.
 *
 * @param alternative a range without `||`
 * @param ecosystem how its versions parse
 */
function floorOfAlternative(alternative: string, ecosystem: Ecosystem | undefined) {
  const text = alternative.trim()
  const interval = /^[[(]\s*([^,\])]*)/.exec(text)
  const hyphen = /^(\S+)\s+-\s+\S+$/.exec(text)
  const comparators =
    interval !== null
      ? [interval[1] ?? '']
      : hyphen !== null
        ? [hyphen[1] ?? '']
        : text.replace(/(>=|<=|~>|~=|===|==|!=|[\^~<>=])\s+/g, '$1').split(/[\s,]+/)

  const floors = comparators.flatMap(comparator => {
    if (/^(?:<|!=)/.test(comparator)) {
      return []
    }

    const written = withoutWildcards(comparator.replace(LOWER, '').trim())
    const version = written === undefined ? undefined : parseVersion(written, ecosystem)

    return written === undefined || version === undefined ? [] : [{ written, version }]
  })

  return floors.sort((a, b) => compareVersions(b.version, a.version))[0]
}

/**
 * The lowest version a declared range accepts, as written without its operator (`^1.2.3`, `~=1.2`, `>=1,<2`, `~> 1.2`, `1.2.x`, `[1.0,2.0)`, `1.2.3 - 2.0.0`, `^1 || ^2`); undefined when it has no lower bound (`*`, `<2`, `latest`).
 *
 * @param range the requirement as the manifest writes it
 * @param ecosystem how its versions parse
 */
export function rangeFloorOf(range: string, ecosystem?: Ecosystem): string | undefined {
  const floors = range.split(/\|\|?/).flatMap(alternative => {
    const floor = floorOfAlternative(alternative, ecosystem)

    return floor === undefined ? [] : [floor]
  })

  return floors.sort((a, b) => compareVersions(a.version, b.version))[0]?.written
}
