import type { ParsedEntry } from './parsed-entry.js'
import type { ParsedFeed } from './parsed-feed.js'
import { langOf } from './lang-of.js'
import { resolveLink } from './resolve-link.js'
import { rssEntryOf } from './rss-entry-of.js'
import { cleanTitle } from './text/clean-title.js'
import { childOf } from './xml/child-of.js'
import { childrenOf } from './xml/children-of.js'
import { textOf } from './xml/text-of.js'
import type { XmlElement } from './xml/xml-element.js'

/** An RSS 2.0 (or 0.9x, or 1.0) document as a feed, or undefined when it has no channel; summaries capped at `summaryChars` when given. */
export function rssFeedOf(
  root: XmlElement,
  baseUrl: string | undefined,
  summaryChars?: number,
): ParsedFeed | undefined {
  const channel = childOf(root, 'channel')

  if (!channel) {
    return undefined
  }

  const link = resolveLink(textOf(childOf(channel, 'link')), baseUrl)
  const base = resolveLink(root.attrs.get('xml:base'), baseUrl) ?? baseUrl ?? link
  const lang = langOf(
    textOf(childOf(channel, 'language')) ||
      textOf(childOf(channel, 'dc:language')) ||
      channel.attrs.get('xml:lang') ||
      root.attrs.get('xml:lang'),
  )
  const entries = [...childrenOf(channel, 'item'), ...childrenOf(root, 'item')]
    .map(item => rssEntryOf(item, base, summaryChars))
    .filter((entry): entry is ParsedEntry => entry !== undefined)

  return {
    kind: 'rss',
    title: cleanTitle(textOf(childOf(channel, 'title')), false),
    ...(link ? { link } : {}),
    ...(lang ? { lang } : {}),
    entries,
  }
}
