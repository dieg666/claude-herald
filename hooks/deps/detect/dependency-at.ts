import type { Dependency, Ecosystem } from '../../../types/index.js'

/**
 * What a parser knows about one declared dependency.
 */
type Declared = {
  ecosystem: Ecosystem
  name: string
  manifestPath: string
  isDev: boolean
  versionInUse?: string | undefined
  range?: string | undefined
  source?: string | undefined
}

/**
 * A text with whitespace trimmed, or undefined when blank.
 *
 * @param value an optional field
 */
function filledOf(value: string | undefined): string | undefined {
  const text = value?.trim()

  return text ? text : undefined
}

/**
 * A Dependency from what a parser found: root-declared when its manifest sits at the root, blank optional fields left out.
 *
 * @param declared the parser's findings
 */
export function dependencyAt(declared: Declared): Dependency {
  const versionInUse = filledOf(declared.versionInUse)
  const range = filledOf(declared.range)
  const source = filledOf(declared.source)

  return {
    ecosystem: declared.ecosystem,
    name: declared.name,
    ...(versionInUse === undefined ? {} : { versionInUse }),
    ...(range === undefined ? {} : { range }),
    isDev: declared.isDev,
    isRoot: !declared.manifestPath.includes('/'),
    manifestPath: declared.manifestPath,
    ...(source === undefined ? {} : { source }),
  }
}
