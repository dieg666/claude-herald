import type { Item } from '../../types/index.js'

/**
 * An item of source `src` with that id suffix, dated when given an ISO date.
 *
 * @param key the id after `src:`, also its title
 * @param publishedAt its date, when dated
 */
export function itemAt(key: string, publishedAt?: string): Item {
  return {
    id: `src:${key}`,
    sourceId: 'src',
    title: key,
    url: `https://example.com/${key}`,
    ...(publishedAt === undefined ? {} : { publishedAt }),
    text: `The full story about ${key}, with enough detail to summarize`,
  }
}
