import { innerHtmlOf } from './xml/inner-html-of.js'
import { textOf } from './xml/text-of.js'
import type { XmlElement } from './xml/xml-element.js'

/** An Atom text construct's value, and whether its `type` makes it HTML (`html`, `xhtml` or an HTML media type). */
export function atomMarkupOf(element: XmlElement | undefined): {
  readonly value: string
  readonly isHtml: boolean
} {
  const type = element?.attrs.get('type')?.trim().toLowerCase() ?? 'text'
  const isHtml = type.includes('html') || element?.attrs.get('mode') === 'escaped'

  return { value: isHtml ? innerHtmlOf(element) : textOf(element), isHtml }
}
