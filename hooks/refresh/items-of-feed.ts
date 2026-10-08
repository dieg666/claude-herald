import type { Item } from '../../types/index.js'
import type { ParsedFeed } from '../feed/parsed-feed.js'
import { isLinkLabel } from '../items/is-link-label.js'
import { itemIdOf } from '../items/item-id-of.js'

/**
 * A parsed feed's entries as items, in feed order; a summary that is only a link label is no text; an entry with no title, no link (its own or the feed's) or nothing to identify it is left out.
 *
 * @param sourceId the source the feed belongs to
 * @param feed the parsed feed
 */
export function itemsOfFeed(sourceId: string, feed: ParsedFeed): Item[] {
  return feed.entries.flatMap(entry => {
    const id = itemIdOf(sourceId, entry)
    const url = entry.link ?? feed.link
    const title = entry.title.trim()
    const lang = entry.lang ?? feed.lang

    if (id === undefined || url === undefined || title === '') {
      return []
    }

    return [
      {
        id,
        sourceId,
        title,
        url,
        ...(entry.publishedAt === undefined ? {} : { publishedAt: entry.publishedAt }),
        text: isLinkLabel(entry.summary ?? '') ? '' : (entry.summary ?? ''),
        ...(lang === undefined ? {} : { lang }),
      },
    ]
  })
}
