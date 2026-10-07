import type { XmlElement } from './xml-element.js'

/** All text inside the element, markup dropped, untrimmed. */
export function textOf(element: XmlElement | undefined): string {
  if (!element) {
    return ''
  }

  return element.children.map(child => (typeof child === 'string' ? child : textOf(child))).join('')
}
