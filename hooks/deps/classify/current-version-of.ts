import type { Dependency } from '../../../types/index.js'
import { rangeFloorOf } from './range-floor-of.js'

/**
 * The version releases are compared against: the one in use (an npm alias's `npm:<name>@` prefix dropped), else the floor of the declared range; undefined when neither gives one.
 *
 * @param dependency the package
 */
export function currentVersionOf(
  dependency: Pick<Dependency, 'ecosystem' | 'versionInUse' | 'range'>,
): string | undefined {
  const inUse = dependency.versionInUse?.trim().replace(/^npm:(?:@[^/@]+\/)?[^@]+@/, '') ?? ''

  if (inUse !== '') {
    return inUse
  }

  return dependency.range === undefined
    ? undefined
    : rangeFloorOf(dependency.range, dependency.ecosystem)
}
