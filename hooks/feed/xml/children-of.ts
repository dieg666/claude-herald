import type { XmlElement } from './xml-element.js'

/** The element's child elements with exactly this qualified name, in order. */
export function childrenOf(element: XmlElement | undefined, name: string): XmlElement[] {
  return (element?.children ?? []).filter(
    (child): child is XmlElement => typeof child !== 'string' && child.name === name,
  )
}
