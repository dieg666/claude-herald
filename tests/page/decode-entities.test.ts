import { describe, expect, test } from 'claude-code/testing'

import Page from '../../hooks/page'

describe('decode-entities', () => {
  test('named references decode', () => {
    expect(
      Page.decodeEntities(
        'Q&amp;A &lt;b&gt; &quot;x&quot; &apos;y&apos; caf&eacute; &mdash; &hellip;',
      ),
    ).toBe('Q&A <b> "x" \'y\' café — …')
  })

  test('numeric references decode, decimal and hex', () => {
    expect(Page.decodeEntities('&#8217; &#x2019; &#X41; &#128512;')).toBe('’ ’ A 😀')
  })

  test('a decoded ampersand is not decoded again', () => {
    expect(Page.decodeEntities('&amp;lt;')).toBe('&lt;')
    expect(Page.decodeEntities('&amp;amp;')).toBe('&amp;')
  })

  test('a reference without its semicolon, an unknown name and a stray ampersand stay', () => {
    expect(Page.decodeEntities('/p?a=1&copy=2&lt=3')).toBe('/p?a=1&copy=2&lt=3')
    expect(Page.decodeEntities('&unknown; AT&T & co &#;')).toBe('&unknown; AT&T & co &#;')
  })

  test('impossible code points become the replacement character', () => {
    expect(Page.decodeEntities('&#0;&#xD800;&#1114112;&#99999999;')).toBe('���&#99999999;')
  })

  test('legacy windows-1252 numbers map to their characters', () => {
    expect(Page.decodeEntities('&#150;&#146;&#128;')).toBe('–’€')
  })
})
