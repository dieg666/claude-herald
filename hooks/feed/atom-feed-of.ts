import { atomEntryOf } from './atom-entry-of.js'
import { atomMarkupOf } from './atom-markup-of.js'
import { langOf } from './lang-of.js'
import type { ParsedEntry } from './parsed-entry.js'
import type { ParsedFeed } from './parsed-feed.js'
import { pickAtomLink } from './pick-atom-link.js'
import { resolveLink } from './resolve-link.js'
import { cleanTitle } from './text/clean-title.js'
import { childOf } from './xml/child-of.js'
import { childrenOf } from './xml/children-of.js'
import type { XmlElement } from './xml/xml-element.js'

/** An Atom `feed` element as a feed; its children are matched under the root's own prefix. */
export function atomFeedOf(root: XmlElement, baseUrl: string | undefined): ParsedFeed {
  const prefix = root.name.slice(0, root.name.indexOf(':') + 1)
  const base = resolveLink(root.attrs.get('xml:base'), baseUrl) ?? baseUrl
  const link = resolveLink(pickAtomLink(root, prefix), base)
  const lang = langOf(root.attrs.get('xml:lang'))
  const title = atomMarkupOf(childOf(root, `${prefix}title`))
  const entries = childrenOf(root, `${prefix}entry`)
    .map(entry => atomEntryOf(entry, prefix, base ?? link))
    .filter((entry): entry is ParsedEntry => entry !== undefined)

  return {
    kind: 'atom',
    title: cleanTitle(title.value, title.isHtml),
    ...(link ? { link } : {}),
    ...(lang ? { lang } : {}),
    entries,
  }
}
