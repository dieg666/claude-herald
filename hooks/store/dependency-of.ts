import type { Dependency, Ecosystem } from '../../types/index.js'
import { ECOSYSTEMS } from './ecosystems.js'
import { isRecord } from './is-record.js'
import { textOf } from './text-of.js'

/**
 * A stored ecosystem name, else undefined.
 *
 * @param value one stored field
 */
function ecosystemOf(value: unknown): Ecosystem | undefined {
  return ECOSYSTEMS.find(ecosystem => ecosystem === value)
}

/**
 * A stored value as a Dependency, its known fields only, or undefined when a required field is missing or blank.
 *
 * @param value one stored dependency
 */
export function dependencyOf(value: unknown): Dependency | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const ecosystem = ecosystemOf(value.ecosystem)
  const name = textOf(value.name)?.trim()
  const manifestPath = textOf(value.manifestPath)

  if (ecosystem === undefined || !name || manifestPath === undefined) {
    return undefined
  }

  const versionInUse = textOf(value.versionInUse)
  const range = textOf(value.range)
  const source = textOf(value.source)

  return {
    ecosystem,
    name,
    ...(versionInUse === undefined ? {} : { versionInUse }),
    ...(range === undefined ? {} : { range }),
    isDev: value.isDev === true,
    isRoot: value.isRoot === true,
    manifestPath,
    ...(source === undefined ? {} : { source }),
  }
}
