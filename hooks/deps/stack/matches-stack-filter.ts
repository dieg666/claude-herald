import type { StackItem } from '../../../types/index.js'
import { ECOSYSTEM_LABELS } from './ecosystem-labels.js'

/**
 * Whether a stack item matches the pane's filter: every word of it, ignoring case, is in the package name, the ecosystem, the level or a flag; a blank filter matches everything.
 *
 * @param item the stack item
 * @param filter the text typed
 */
export function matchesStackFilter(item: StackItem, filter: string): boolean {
  const { release } = item
  const haystack = [
    release.name,
    release.ecosystem,
    ECOSYSTEM_LABELS[release.ecosystem],
    release.level,
    release.isPrerelease ? 'pre-release' : '',
    release.breaking ? 'breaking' : '',
    release.security ? 'security' : '',
  ]
    .join(' ')
    .toLowerCase()

  return filter
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .every(word => haystack.includes(word))
}
