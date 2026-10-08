import type { StackRelease } from '../../../types/index.js'
import { collapsedTextOf } from '../../page/collapsed-text-of.js'

/**
 * A release's package and versions on one line: `pkg current → new`, `pkg → new` without a version in use, `pkg` without a version.
 *
 * @param release the release
 */
export function stackVersionsOf(
  release: Pick<StackRelease, 'name' | 'current' | 'version'>,
): string {
  const line = (text: string) => collapsedTextOf(text).trim()
  const name = line(release.name)

  if (release.version === undefined) {
    return name
  }

  const current = release.current === undefined ? '' : ` ${line(release.current)}`

  return `${name}${current} → ${line(release.version)}`
}
