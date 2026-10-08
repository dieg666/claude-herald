import type { StackItem } from '../../../types/index.js'
import { collapsedTextOf } from '../../page/collapsed-text-of.js'
import { stackVersionsOf } from './stack-versions-of.js'

/**
 * A stack item's headline: `pkg current → new`, then ` · <release title>` when the title says more than the version.
 *
 * @param item the stack item
 */
export function stackLineOf(item: StackItem): string {
  const versions = stackVersionsOf(item.release)
  const title = collapsedTextOf(item.title).trim()
  const { version } = item.release
  const isVersionOnly =
    title === '' || (version !== undefined && (title === version || title === `v${version}`))

  return isVersionOnly ? versions : `${versions} · ${title}`
}
