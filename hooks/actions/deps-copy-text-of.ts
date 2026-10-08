import type { StackItem } from '../../types/index.js'
import { collapsedTextOf } from '../page/collapsed-text-of.js'

/**
 * The copy-for-Claude text of a stack item: the deps template with `{pkg}`, `{current}`, `{new}` and `{url}` filled once each (an unknown version as `unknown`), every value made one line first, since feed text is untrusted.
 *
 * @param template the user's deps template
 * @param item the stack item
 */
export function depsCopyTextOf(template: string, item: StackItem): string {
  const values = new Map([
    ['{pkg}', item.release.name],
    ['{current}', item.release.current ?? 'unknown'],
    ['{new}', item.release.version ?? item.title],
    ['{url}', item.url],
  ])

  // One pass, so a value that holds a placeholder is not filled again.
  return template.replace(/\{(?:pkg|current|new|url)\}/g, placeholder =>
    collapsedTextOf(values.get(placeholder) ?? '').trim(),
  )
}
