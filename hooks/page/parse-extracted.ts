import type { ExtractedItem } from './extracted-item.js'
import { extractedItemOf } from './extracted-item-of.js'
import { jsonArraysIn } from './json-arrays-in.js'
import { MAX_EXTRACTED_ITEMS } from './max-extracted-items.js'

/**
 * The items in the model's reply, validated: the first JSON array that holds a usable item is
 * read; entries that are not objects with a title and an http(s) address are dropped, dates that
 * do not parse are omitted, duplicate addresses keep their first entry, and at most 30 remain.
 * Never throws: a reply without such an array gives an empty list.
 *
 * @param reply the model's reply text
 * @param pageUrl the page's address, which relative addresses resolve against
 * @returns the items in the reply's order
 */
export const parseExtracted = (reply: string, pageUrl: string): ExtractedItem[] => {
  if (typeof reply !== 'string') {
    return []
  }

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

    if (items.size > 0) {
      return [...items.values()]
    }
  }

  return []
}
