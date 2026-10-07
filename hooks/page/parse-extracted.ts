import type { ExtractedItem } from './extracted-item.js'
import { extractedItemOf } from './extracted-item-of.js'
import { jsonArraysIn } from './json-arrays-in.js'
import { MAX_EXTRACTED_ITEMS } from './max-extracted-items.js'

/**
 * The validated items in the model's reply, which never throws on bad input.
 *
 * @param reply the model's reply text
 * @param pageUrl the page's address, which relative addresses resolve against
 * @returns up to 30 items without duplicate addresses from the array with the most valid items (the last on a tie), or none
 */
export const parseExtracted = (reply: string, pageUrl: string): ExtractedItem[] => {
  if (typeof reply !== 'string') {
    return []
  }

  let best: ExtractedItem[] = []

  for (const array of jsonArraysIn(reply)) {
    const items = new Map<string, ExtractedItem>()

    for (const entry of array) {
      const item = extractedItemOf(entry, pageUrl)

      if (item !== undefined && !items.has(item.url)) {
        items.set(item.url, item)
      }

      if (items.size === MAX_EXTRACTED_ITEMS) {
        break
      }
    }

    if (items.size > 0 && items.size >= best.length) {
      best = [...items.values()]
    }
  }

  return best
}
