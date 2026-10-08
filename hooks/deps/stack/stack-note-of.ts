import type { StackRelease, StackRollup } from '../../../types/index.js'
import { ECOSYSTEM_LABELS } from './ecosystem-labels.js'

/**
 * The line under a stack item's headline: its ecosystem, level and flags, `npm · major · breaking`; on a package's row a flag brought by another release names it (`breaking in 4.6.3`) and the count of releases shown follows (`5 releases`).
 *
 * @param release the release
 * @param rollup the package's other releases, on a package's row
 */
export function stackNoteOf(release: StackRelease, rollup?: StackRollup): string {
  const flag = (name: 'breaking' | 'security', isSet: boolean, version: string | undefined) =>
    version !== undefined ? [`${name} in ${version}`] : isSet ? [name] : []

  return [
    ECOSYSTEM_LABELS[release.ecosystem],
    ...(release.level === 'unknown' ? [] : [release.level]),
    ...(release.isPrerelease ? ['pre-release'] : []),
    ...flag('breaking', release.breaking, rollup?.breakingIn),
    ...flag('security', release.security, rollup?.securityIn),
    ...(rollup !== undefined && rollup.releases > 1 ? [`${rollup.releases} releases`] : []),
  ].join(' · ')
}
