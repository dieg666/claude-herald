import { describe, expect, test } from 'claude-code/testing'

import Xml from '../../../hooks/feed/xml'

describe('decode-entities', () => {
  test('named references', () => {
    expect(
      Xml.decodeEntities('&amp; &lt; &gt; &quot; &apos; caf&eacute;&nbsp;&mdash;&hellip;'),
    ).toBe('& < > " \' caf\u00E9\u00A0\u2014\u2026')
  })

  test('decimal and hex references, either case of x', () => {
    expect(Xml.decodeEntities('&#8217;&#x2019;&#X2019;&#128512;&#39;')).toBe(
      "\u2019\u2019\u2019\u{1F600}'",
    )
  })

  test('128 to 159 read as Windows-1252, as browsers do', () => {
    expect(Xml.decodeEntities('&#146;&#147;&#148;&#150;&#128;')).toBe(
      '\u2019\u201C\u201D\u2013\u20AC',
    )
  })

  test('invalid code points become the replacement character; NUL disappears', () => {
    expect(Xml.decodeEntities('a&#xD800;b&#1114112;c&#0;d')).toBe('a\uFFFDb\uFFFDcd')
  })

  test('decodes once: double encoding leaves one level', () => {
    expect(Xml.decodeEntities('AT&amp;amp;T')).toBe('AT&amp;T')
  })

  test('unknown names, missing semicolons and bare ampersands stay as written', () => {
    expect(Xml.decodeEntities('&bogus; &amp AT&T & done')).toBe('&bogus; &amp AT&T & done')
  })
})
