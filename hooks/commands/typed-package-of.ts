import type { Dependency } from '../../types/index.js'
import { ECOSYSTEM_ALIASES } from '../deps/classify/ecosystem-aliases.js'
import { ECOSYSTEMS } from '../store/ecosystems.js'

/**
 * A package typed as `<ecosystem>:<name>`: the ecosystem by its name or a common alias (`npm`, `pypi` or `python`, `cargo` or `rust`, `github`, ...), any case, the name trimmed; undefined when the text before the first `:` is not one or the name is blank.
 *
 * @param text what the person typed
 */
export function typedPackageOf(text: string): Pick<Dependency, 'ecosystem' | 'name'> | undefined {
  const cut = text.indexOf(':')
  const prefix = text.slice(0, cut).trim().toLowerCase()
  const name = text.slice(cut + 1).trim()
  const ecosystem =
    ECOSYSTEMS.find(known => known === prefix) ??
    (Object.hasOwn(ECOSYSTEM_ALIASES, prefix) ? ECOSYSTEM_ALIASES[prefix] : undefined)

  return cut > 0 && name !== '' && ecosystem !== undefined ? { ecosystem, name } : undefined
}
