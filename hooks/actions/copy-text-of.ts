import type { Item } from '../../types/index.js'
import { collapsedTextOf } from '../page/collapsed-text-of.js'

/**
 * The copy-for-Claude text: the template with `{title}`, `{url}` and `{source}` filled once each, the item's fields made one line first, since feed text is untrusted.
 *
 * @param template the user's template
 * @param item the item
 * @param sourceName the name of the item's source
 */
export function copyTextOf(template: string, item: Item, sourceName: string): string {
  const values = new Map([
    ['{title}', item.title],
    ['{url}', item.url],
    ['{source}', sourceName],
  ])

  // One pass, so a title that holds a placeholder is not filled again.
  return template.replace(/\{(?:title|url|source)\}/g, placeholder =>
    collapsedTextOf(values.get(placeholder) ?? '').trim(),
  )
}
