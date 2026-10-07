import type { XmlElement } from './xml-element.js'

/** The element's first child element with exactly this qualified name. */
export function childOf(element: XmlElement | undefined, name: string): XmlElement | undefined {
  for (const child of element?.children ?? []) {
    if (typeof child !== 'string' && child.name === name) {
      return child
    }
  }

  return undefined
}
