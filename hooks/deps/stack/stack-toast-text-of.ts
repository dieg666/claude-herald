import type { StackItem } from '../../../types/index.js'
import { fitToast } from '../../refresh/fit-toast.js'
import { isFlaggedRelease } from './is-flagged-release.js'
import { stackVersionsOf } from './stack-versions-of.js'

/**
 * A release as a toast names it: `pkg current → new`, ` ⚠` after a breaking or security one.
 *
 * @param item the stack item
 */
function nameOf(item: StackItem): string {
  const { release } = item

  return `${stackVersionsOf(release)}${isFlaggedRelease(release) ? ' ⚠' : ''}`
}

/**
 * The one toast for a refresh's new releases, grouped as the sources' toast is: `1 release: a`, `2 releases: a, b`, `3 releases: a …`, cut at a word to fit; empty for none.
 *
 * @param items the new releases, the one to name first
 */
export function stackToastTextOf(items: readonly StackItem[]): string {
  const [first, second] = items

  if (first === undefined) {
    return ''
  }

  if (second === undefined) {
    return fitToast(`1 release: ${nameOf(first)}`)
  }

  return fitToast(
    items.length === 2
      ? `2 releases: ${nameOf(first)}, ${nameOf(second)}`
      : `${items.length} releases: ${nameOf(first)} …`,
  )
}
