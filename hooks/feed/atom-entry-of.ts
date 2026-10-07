import { atomMarkupOf } from './atom-markup-of.js'
import { parseDate } from './date/parse-date.js'
import { entryOf } from './entry-of.js'
import { langOf } from './lang-of.js'
import type { ParsedEntry } from './parsed-entry.js'
import { pickAtomLink } from './pick-atom-link.js'
import { resolveLink } from './resolve-link.js'
import { cleanTitle } from './text/clean-title.js'
import { summaryOf } from './text/summary-of.js'
import { childOf } from './xml/child-of.js'
import { textOf } from './xml/text-of.js'
import type { XmlElement } from './xml/xml-element.js'

/** An Atom `entry` as an entry: summary before content, published before updated. */
export function atomEntryOf(
  entry: XmlElement,
  prefix: string,
  base: string | undefined,
): ParsedEntry | undefined {
  const entryBase = resolveLink(entry.attrs.get('xml:base'), base) ?? base
  const title = atomMarkupOf(childOf(entry, `${prefix}title`))
  const summary = atomMarkupOf(childOf(entry, `${prefix}summary`))
  const contentElement = childOf(entry, `${prefix}content`)
  const content = contentElement?.attrs.has('src') ? undefined : atomMarkupOf(contentElement)
  const dateOf = (name: string) => parseDate(textOf(childOf(entry, `${prefix}${name}`)))

  return entryOf({
    guid: textOf(childOf(entry, `${prefix}id`)).trim() || undefined,
    link: resolveLink(pickAtomLink(entry, prefix), entryBase),
    title: cleanTitle(title.value, title.isHtml),
    summary:
      summaryOf(summary.value, summary.isHtml) ??
      (content ? summaryOf(content.value, content.isHtml) : undefined),
    publishedAt: dateOf('published') ?? dateOf('updated') ?? dateOf('issued') ?? dateOf('modified'),
    lang: langOf(entry.attrs.get('xml:lang')),
  })
}
