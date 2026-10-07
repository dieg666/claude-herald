import { describe, expect, test } from 'claude-code/testing'

import Feed from '../../../hooks/feed'
import Xml from '../../../hooks/feed/xml'

const rootOf = (xml: string): Xml.XmlElement => {
  const { root } = Xml.scanXml(xml)

  if (!root) {
    throw new Error('no root')
  }

  return root
}

const depthOf = (element: Xml.XmlElement): number => {
  let depth = 1
  let current: Xml.XmlElement | undefined = element

  while (
    (current = current.children.find((child): child is Xml.XmlElement => typeof child !== 'string'))
  ) {
    depth++
  }

  return depth
}

describe('scan-xml', () => {
  test('elements, attributes in either quote, and a closed root', () => {
    const scan = Xml.scanXml(`<r a="1 > 0" b='two' c=bare d><x:y/>text</r>`)

    expect(scan.closed).toBe(true)
    expect(scan.root?.name).toBe('r')
    expect([...(scan.root?.attrs ?? [])]).toEqual([
      ['a', '1 > 0'],
      ['b', 'two'],
      ['c', 'bare'],
      ['d', ''],
    ])
    expect(scan.root?.children).toEqual([{ name: 'x:y', attrs: new Map(), children: [] }, 'text'])
  })

  test('text and attribute values are entity-decoded; CDATA is kept raw', () => {
    const root = rootOf('<r t="a &amp; b">x &lt;p&gt; <![CDATA[<p>&amp;</p>]]> y</r>')

    expect(root.attrs.get('t')).toBe('a & b')
    expect(Xml.textOf(root)).toBe('x <p> <p>&amp;</p> y')
  })

  test('comments, processing instructions and a doctype are skipped; its entities are never expanded', () => {
    const scan = Xml.scanXml(
      '<?xml version="1.0"?><!-- c --><!DOCTYPE r [<!ENTITY a "aaaa">]><r><!-- <b> -->&a;<?pi x?></r>',
    )

    expect(scan.closed).toBe(true)
    expect(scan.root?.children).toEqual(['&a;'])
  })

  test('an unclosed child closes with its parent, and a stray end tag is ignored', () => {
    const root = rootOf('<r><p>one<br>two</p></q><s/></r>')

    expect(Xml.innerHtmlOf(root)).toBe('<p>one<br>two</br></p><s></s>')
  })

  test('text before the root and anything after it are ignored', () => {
    const scan = Xml.scanXml('junk <r>in</r><other>after</other>')

    expect(scan.root?.children).toEqual(['in'])
    expect(scan.closed).toBe(true)
  })

  test('an unclosed root or construct leaves the scan open', () => {
    for (const xml of [
      '<r>',
      '<r><a>',
      '<r><![CDATA[x',
      '<r><!-- x',
      '<r a="x',
      '<r><a b',
      '<r><?pi',
      '<!DOCTYPE r [ <r/>',
    ]) {
      expect(Xml.scanXml(xml).closed).toBe(false)
    }
  })

  test('nesting beyond the depth limit keeps its text but not its elements', () => {
    const root = rootOf(`<r>${'<a>'.repeat(200)}deep${'</a>'.repeat(200)}</r>`)

    expect(depthOf(root)).toBe(Feed.FEED_LIMITS.depth)
    expect(Xml.textOf(root)).toBe('deep')
  })

  test('a text-only document has no root', () => {
    expect(Xml.scanXml('just text & < more')).toEqual({ root: undefined, closed: false })
  })
})
