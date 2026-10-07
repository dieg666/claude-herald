import { NON_CONTENT_RELS } from './non-content-rels.js'
import { childrenOf } from './xml/children-of.js'
import type { XmlElement } from './xml/xml-element.js'

const relOf = (link: XmlElement) => (link.attrs.get('rel') ?? 'alternate').trim()

const isHtml = (link: XmlElement) => {
  const type = link.attrs.get('type')

  return type === undefined || type.includes('html')
}

/** The href of an Atom element's alternate link (a link without rel is one), else its first link to a page. */
export function pickAtomLink(element: XmlElement, prefix: string): string | undefined {
  const links = childrenOf(element, `${prefix}link`).filter(
    link => (link.attrs.get('href') ?? '').trim() !== '',
  )
  const alternates = links.filter(link => relOf(link) === 'alternate')
  const picked =
    alternates.find(isHtml) ??
    alternates[0] ??
    links.find(link => !NON_CONTENT_RELS.has(relOf(link)))

  return picked?.attrs.get('href')
}
