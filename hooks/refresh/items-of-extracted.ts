import type { Item } from '../../types/index.js'
import { itemIdOf } from '../items/item-id-of.js'
import type { ExtractedItem } from '../page/extracted-item.js'

/**
 * The items a model extracted from a page as items of its source, ids from their addresses.
 *
 * @param sourceId the page source
 * @param extracted the validated items
 */
export function itemsOfExtracted(sourceId: string, extracted: readonly ExtractedItem[]): Item[] {
  return extracted.flatMap(entry => {
    const id = itemIdOf(sourceId, entry)

    return id === undefined
      ? []
      : [
          {
            id,
            sourceId,
            title: entry.title,
            url: entry.url,
            ...(entry.publishedAt === undefined ? {} : { publishedAt: entry.publishedAt }),
            text: '',
          },
        ]
  })
}
