import { DEPS_LIST_MAX } from './deps-list-max.js'
import { ECOSYSTEMS } from './ecosystems.js'

/**
 * Stored package keys, each `<ecosystem>:<name>` with a known ecosystem and a non-blank name (trimmed), duplicates and other entries dropped, at most `DEPS_LIST_MAX`; empty when the value is not a list.
 *
 * @param value what a project's record holds under `ignored`
 */
export function depKeysOf(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  const keys = value.flatMap(entry => {
    if (typeof entry !== 'string') {
      return []
    }

    const cut = entry.indexOf(':')
    const ecosystem = entry.slice(0, cut)
    const name = entry.slice(cut + 1).trim()

    return cut > 0 && name !== '' && ECOSYSTEMS.some(known => known === ecosystem)
      ? [`${ecosystem}:${name}`]
      : []
  })

  return [...new Set(keys)].slice(0, DEPS_LIST_MAX)
}
