import type { StackRelease } from '../../types/index.js'
import { ECOSYSTEMS } from './ecosystems.js'
import { isRecord } from './is-record.js'
import { textOf } from './text-of.js'

/**
 * The levels a stored release may name.
 */
const LEVELS: readonly StackRelease['level'][] = ['patch', 'minor', 'major', 'unknown']

/**
 * A stored release as a StackRelease, its known fields only, or undefined when its id, ecosystem or name is missing.
 *
 * @param value one stored release
 */
export function stackReleaseOf(value: unknown): StackRelease | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const releaseId = textOf(value.releaseId)
  const ecosystem = ECOSYSTEMS.find(each => each === value.ecosystem)
  const name = textOf(value.name)?.trim()

  if (!releaseId || ecosystem === undefined || !name) {
    return undefined
  }

  const current = textOf(value.current)
  const version = textOf(value.version)

  return {
    releaseId,
    ecosystem,
    name,
    ...(current === undefined ? {} : { current }),
    ...(version === undefined ? {} : { version }),
    level: LEVELS.find(level => level === value.level) ?? 'unknown',
    isPrerelease: value.isPrerelease === true,
    breaking: value.breaking === true,
    security: value.security === true,
  }
}
