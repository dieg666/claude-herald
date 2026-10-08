import { collapsedTextOf } from './collapsed-text-of.js'
import type { ExtractedItem } from './extracted-item.js'

/**
 * Text as one lower-case line with invisible characters removed, for comparing.
 *
 * @param text the text
 */
function foldedOf(text: string): string {
  return collapsedTextOf(text).trim().toLowerCase()
}

/**
 * The items with each teaser kept only when the page text holds it (any case and spacing), so a teaser the model wrote itself is dropped.
 *
 * @param items the validated items
 * @param pageText the page text the model read
 */
export function withPageTeasers(
  items: readonly ExtractedItem[],
  pageText: string,
): ExtractedItem[] {
  const page = foldedOf(pageText)

  return items.map(item => {
    if (item.teaser === undefined || page.includes(foldedOf(item.teaser))) {
      return item
    }

    const { teaser: _dropped, ...rest } = item

    return rest
  })
}
