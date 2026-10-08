import type { StackItem } from '../../../types/index.js'
import { collapsedTextOf } from '../../page/collapsed-text-of.js'

/**
 * A stack item's headline without its package, for a row that shows the package in a column of its own: `current → new` (`→ new` without a version in use), then ` · <release title>` when the title says more than the version (`v1.2.3` and `<pkg>@1.2.3` say no more); the title alone for a release that names no version.
 *
 * @param item the stack item
 */
export function stackHeadlineOf(item: StackItem): string {
  const line = (text: string) => collapsedTextOf(text).trim()
  const { current, version } = item.release
  const title = line(item.title)

  if (version === undefined) {
    return title
  }

  const bare = line(version)
  const versions = `${current === undefined ? '' : `${line(current)} `}→ ${bare}`
  const tagged = `${line(item.release.name)}@`
  const isVersionOnly = [bare, `v${bare}`, `${tagged}${bare}`, `${tagged}v${bare}`, ''].includes(
    title,
  )

  return isVersionOnly ? versions : `${versions} · ${title}`
}
