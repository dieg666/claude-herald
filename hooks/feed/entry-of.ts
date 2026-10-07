import { FEED_LIMITS } from './feed-limits.js'
import type { ParsedEntry } from './parsed-entry.js'
import { clipText } from './text/clip-text.js'

/** An entry from its parts, titled from its summary or link when untitled; undefined when nothing names it. */
export function entryOf(parts: {
  readonly guid: string | undefined
  readonly link: string | undefined
  readonly title: string
  readonly summary: string | undefined
  readonly publishedAt: string | undefined
  readonly lang: string | undefined
}): ParsedEntry | undefined {
  const title =
    parts.title || clipText(parts.summary ?? '', FEED_LIMITS.titleChars / 3) || parts.link

  if (!title) {
    return undefined
  }

  return {
    ...(parts.guid ? { guid: parts.guid } : {}),
    ...(parts.link ? { link: parts.link } : {}),
    title,
    ...(parts.summary ? { summary: parts.summary } : {}),
    ...(parts.publishedAt ? { publishedAt: parts.publishedAt } : {}),
    ...(parts.lang ? { lang: parts.lang } : {}),
  }
}
