import type { Dependency, Ecosystem } from '../../types/index.js'

/**
 * A stored package key, `<ecosystem>:<name>`, as its ecosystem and name.
 *
 * @param key a key from a project's ignored list
 */
export function depKeyPartsOf(key: string): Pick<Dependency, 'ecosystem' | 'name'> {
  const cut = key.indexOf(':')

  return { ecosystem: key.slice(0, cut) as Ecosystem, name: key.slice(cut + 1) }
}
