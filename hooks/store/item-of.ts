import type { Item } from '../../types/index.js'
import { isRecord } from './is-record.js'
import { textOf } from './text-of.js'

/**
 * A string that is not blank, else undefined.
 *
 * @param value one stored field
 */
function filledOf(value: unknown): string | undefined {
  const text = textOf(value)

  return text === undefined || text.trim() === '' ? undefined : text
}

/**
 * A stored value as an Item, its known fields only, or undefined when a required field is missing or blank.
 *
 * @param value one stored item
 */
export function itemOf(value: unknown): Item | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const id = filledOf(value.id)
  const sourceId = filledOf(value.sourceId)
  const title = filledOf(value.title)
  const url = filledOf(value.url)

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
