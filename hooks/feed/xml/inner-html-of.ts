import { localNameOf } from './local-name-of.js'
import type { XmlElement } from './xml-element.js'

/** The element's content as HTML: decoded text plus child elements as bare tags. */
export function innerHtmlOf(element: XmlElement | undefined): string {
  if (!element) {
    return ''
  }

  return element.children
    .map(child => {
      if (typeof child === 'string') {
        return child
      }

      const name = localNameOf(child.name)

      return `<${name}>${innerHtmlOf(child)}</${name}>`
    })
    .join('')
}
