import type { Item } from '../../types/index.js'
import { hasText } from './has-text.js'

/**
 * One item from several copies of the same story: the first copy's fields under the given id, with what it lacks (a date, a language, text of its own) taken from the others in order.
 *
 * @param id the id the result keeps
 * @param copies the copies, the one that wins first; at least one
 */
export function combinedItemOf(id: string, copies: readonly [Item, ...Item[]]): Item {
  const [first, ...others] = copies
  const publishedAt =
    first.publishedAt ?? others.find(item => item.publishedAt !== undefined)?.publishedAt
  const lang = first.lang ?? others.find(item => item.lang !== undefined)?.lang
  const text = hasText(first) ? first.text : (others.find(hasText)?.text ?? first.text)

  return {
    ...first,
    id,
    text,
    ...(publishedAt === undefined ? {} : { publishedAt }),
    ...(lang === undefined ? {} : { lang }),
  }
}
