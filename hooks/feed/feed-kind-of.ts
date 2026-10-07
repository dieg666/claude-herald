import type { FeedKind } from './feed-kind.js'
import { localNameOf } from './xml/local-name-of.js'
import type { XmlElement } from './xml/xml-element.js'

/** The format a root element announces: `rss` or RSS 1.0's `rdf:RDF`, Atom's `feed`, or neither. */
export function feedKindOf(root: XmlElement): FeedKind | undefined {
  const name = localNameOf(root.name)

  if (name === 'rss' || name === 'RDF') {
    return 'rss'
  }

  return name === 'feed' ? 'atom' : undefined
}
