import type { Item } from '../../types/index.js'
import { isRecord } from './is-record.js'
import { textOf } from './text-of.js'

/**
 * A stored value as an Item, its known fields only, or undefined when a required field is missing.
 *
 * @param value one stored item
 */
export function itemOf(value: unknown): Item | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const id = textOf(value.id)
  const sourceId = textOf(value.sourceId)
  const title = textOf(value.title)
  const url = textOf(value.url)

  if (id === undefined || sourceId === undefined || title === undefined || url === undefined) {
    return undefined
  }

  const publishedAt = textOf(value.publishedAt)
  const lang = textOf(value.lang)

  return {
    id,
    sourceId,
    title,
    url,
    ...(publishedAt === undefined ? {} : { publishedAt }),
    text: textOf(value.text) ?? '',
    ...(lang === undefined ? {} : { lang }),
  }
}
