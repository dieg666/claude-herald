import { parseDate } from './date/parse-date.js'
import { entryOf } from './entry-of.js'
import { langOf } from './lang-of.js'
import type { ParsedEntry } from './parsed-entry.js'
import { resolveLink } from './resolve-link.js'
import { cleanTitle } from './text/clean-title.js'
import { summaryOf } from './text/summary-of.js'
import { childOf } from './xml/child-of.js'
import { innerHtmlOf } from './xml/inner-html-of.js'
import { textOf } from './xml/text-of.js'
import type { XmlElement } from './xml/xml-element.js'

/** An RSS `item` as an entry; a permalink guid stands in for a missing link; the summary capped at `summaryChars` when given. */
export function rssEntryOf(
  item: XmlElement,
  base: string | undefined,
  summaryChars?: number,
): ParsedEntry | undefined {
  const guidElement = childOf(item, 'guid')
  const guid = textOf(guidElement).trim() || item.attrs.get('rdf:about')?.trim() || undefined
  const linkElement = childOf(item, 'link')
  const permalink = guidElement?.attrs.get('isPermaLink')?.trim().toLowerCase() !== 'false'
  const link =
    resolveLink(textOf(linkElement) || linkElement?.attrs.get('href'), base) ??
    (permalink ? resolveLink(guid, base) : undefined)

  return entryOf({
    guid,
    link,
    title: cleanTitle(textOf(childOf(item, 'title')), false),
    summary:
      summaryOf(innerHtmlOf(childOf(item, 'description')), true, summaryChars) ??
      summaryOf(innerHtmlOf(childOf(item, 'content:encoded')), true, summaryChars),
    publishedAt:
      parseDate(textOf(childOf(item, 'pubDate'))) ?? parseDate(textOf(childOf(item, 'dc:date'))),
    lang: langOf(textOf(childOf(item, 'dc:language')) || item.attrs.get('xml:lang')),
  })
}
