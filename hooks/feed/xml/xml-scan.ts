import type { XmlElement } from './xml-element.js'

/** A scanned document: its first element, and whether that element was closed. */
export type XmlScan = {
  readonly root?: XmlElement
  /** True when the root's end tag was reached with no construct left open. */
  readonly closed: boolean
}
