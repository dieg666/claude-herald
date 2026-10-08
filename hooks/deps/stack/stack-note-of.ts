import type { StackRelease } from '../../../types/index.js'
import { ECOSYSTEM_LABELS } from './ecosystem-labels.js'

/**
 * The line under a stack item's headline: its ecosystem, level and flags, `npm · major · breaking`.
 *
 * @param release the release
 */
export function stackNoteOf(release: StackRelease): string {
  return [
    ECOSYSTEM_LABELS[release.ecosystem],
    ...(release.level === 'unknown' ? [] : [release.level]),
    ...(release.isPrerelease ? ['pre-release'] : []),
    ...(release.breaking ? ['breaking'] : []),
    ...(release.security ? ['security'] : []),
  ].join(' · ')
}
