import { collapsedTextOf } from './collapsed-text-of.js'
import { cutTo } from './cut-to.js'
import type { ExtractedItem } from './extracted-item.js'
import { isoDateOf } from './iso-date-of.js'
import { resolvePageUrl } from './resolve-page-url.js'
import { TITLE_CAP } from './title-cap.js'

const MAX_URL = 2048

/**
 * One entry of the model's array as an item, or nothing when it is not usable.
 *
 * @param entry the parsed JSON value
 * @param pageUrl the page's address, which relative addresses resolve against
 * @returns the item, or undefined for a non-object, a missing or empty title, or no http(s) address
 */
export const extractedItemOf = (entry: unknown, pageUrl: string): ExtractedItem | undefined => {
  if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
    return undefined
  }

  const { title, url, date } = entry as Record<string, unknown>

  if (typeof title !== 'string' || typeof url !== 'string' || url.length > MAX_URL) {
    return undefined
  }

  const text = cutTo(collapsedTextOf(title).trim(), TITLE_CAP).trimEnd()
  const resolved = resolvePageUrl(url, pageUrl)

  if (text === '' || resolved === undefined) {
    return undefined
  }

  const publishedAt = isoDateOf(date)

  return publishedAt === undefined
    ? { title: text, url: resolved }
    : { title: text, url: resolved, publishedAt }
}
