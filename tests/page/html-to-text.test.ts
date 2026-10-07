import { describe, expect, test } from 'claude-code/testing'

import Page from '../../hooks/page'
import Fixtures from '../fixtures/pages'

const PAGE = 'https://example.com/blog/index.html'

const textOf = (html: string) => Page.htmlToText(html, PAGE)

const unpairedSurrogate = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/

describe('html-to-text', () => {
  const news = Page.htmlToText(Fixtures.ANTHROPIC_NEWS_HTML, Fixtures.ANTHROPIC_NEWS_URL)

  test('the Anthropic news page keeps real headlines with their absolute links', () => {
    expect(news).toContain(
      'Expanding the Cyber Verification Program <https://www.anthropic.com/news/cyber-verification-program>',
    )
    expect(news).toContain(
      'Barclays scales Claude to upgrade operations and improve client experience <https://www.anthropic.com/news/barclays-scales-claude>',
    )
    expect(news).toContain('Introducing Claude Opus 5.5')
    expect(news).toContain('<https://www.anthropic.com/claude-opus-5-5>')
    expect(news).toContain('<https://www.anthropic.com/features/ebola-response>')
    expect(news).toContain('Oct 6, 2026')
  })

  test('the Anthropic news page loses its script, style, svg, head and markup', () => {
    expect(news).not.toContain('__next_f')
    expect(news).not.toContain('$Sreact')
    expect(news).not.toContain('Newsroom \\ Anthropic')
    expect(news).not.toContain('stylesheet')
    expect(news).not.toContain('charSet')
    expect(news).not.toContain('FeaturedGrid')
    expect(news).not.toMatch(/<(?!https?:\/\/)/)
    expect(news).not.toMatch(/&(?:amp|lt|gt|quot|#\d+);/)
  })

  test('the Anthropic news page is collapsed to trimmed single-spaced lines', () => {
    expect(news).not.toMatch(/[ \t]{2}/)
    expect(news).not.toContain('\n\n')
    expect(news).not.toMatch(/^\s|\s$/)
    expect(news).not.toMatch(/[ \t]$/m)
    expect(news.length).toBeLessThan(Page.PAGE_TEXT_CAP)
  })

  test('script, style, svg, noscript, head, comments and CDATA-ish script text are dropped', () => {
    const text = textOf(Fixtures.MESSY_PAGE_HTML)

    expect(text).not.toMatch(/_MARKER/)
    expect(text).not.toContain('hidden')
    expect(text).not.toContain('/nope')
    expect(text).not.toContain('CDATA')
    expect(text).toContain('News & Updates')
  })

  test('link targets follow their text, resolved and entity-decoded', () => {
    const text = Page.htmlToText(Fixtures.MESSY_PAGE_HTML, Fixtures.MESSY_PAGE_URL)

    expect(text).toContain('First Foo & Bar <https://example.com/news/foo?a=1&b=2>')
    expect(text).toContain('Protocol relative CDN post <https://cdn.example.org/post>')
    expect(text).toContain('Relative page <https://example.com/blog/relative/page.html>')
    expect(text).toContain('Absolute <https://other.example/x#frag>')
    expect(text).toContain('Spaced <https://example.com/spaced>')
  })

  test('javascript, mailto, tel and same-page links keep their text and lose their target', () => {
    const text = textOf(Fixtures.MESSY_PAGE_HTML)

    for (const word of ['Evil js', 'Mail us', 'Top', 'Call']) {
      expect(text).toContain(word)
    }

    expect(text).not.toContain('javascript')
    expect(text).not.toContain('mailto')
    expect(text).not.toContain('tel:')
    expect(text).not.toContain('#top')
    expect(text).not.toMatch(/(?:Evil js|Mail us|Top|Call) </)
  })

  test('a link without text gets no target', () => {
    expect(textOf(Fixtures.MESSY_PAGE_HTML)).not.toContain('img-only')
    expect(textOf('<a href="/x"><img src="a.png"> </a>after')).toBe('after')
  })

  test('an unclosed link and unclosed formatting still end the text and close the link', () => {
    expect(textOf(Fixtures.MESSY_PAGE_HTML)).toContain(
      'Unclosed link text Bold unclosed <https://example.com/unclosed>',
    )
  })

  test('entities in text decode once, and unknown ones stay', () => {
    const text = textOf(Fixtures.MESSY_PAGE_HTML)

    expect(text).toContain('Café — 😀')
    expect(text).toContain('&unknown; &lt;')
  })

  test('a quoted greater-than inside an attribute does not end the tag', () => {
    expect(textOf('<a href="/x" title="a > b">T</a>')).toBe('T <https://example.com/x>')
  })

  test('an attribute entity is decoded but a bare ampersand name is not', () => {
    expect(textOf('<a href="/p?a=1&amp;b=2&copy=3">T</a>')).toBe(
      'T <https://example.com/p?a=1&b=2&copy=3>',
    )
    expect(textOf('<a href="/p?a=&#38;b">T</a>')).toBe('T <https://example.com/p?a=&b>')
  })

  test('adjacent links and nested links each keep their own target', () => {
    expect(textOf('<a href="/1">one</a><a href="/2">two</a>')).toBe(
      'one <https://example.com/1> two <https://example.com/2>',
    )
    expect(textOf('<a href="/1">one<a href="/2">two</a>')).toBe(
      'one <https://example.com/1> two <https://example.com/2>',
    )
  })

  test('a link that spans blocks gets its target after its last line', () => {
    expect(textOf('<a href="/x"><h3>Title</h3><p>Body</p></a><p>Next</p>')).toBe(
      'Title\nBody <https://example.com/x>\nNext',
    )
  })

  test('block tags break lines and inline tags do not', () => {
    expect(textOf('<div><p>one<p>two<li>three <b>four</b>five<br>six<td>a<td>b')).toBe(
      'one\ntwo\nthree fourfive\nsix a b',
    )
    expect(textOf('x<span>a</span><span>b</span>y')).toBe('x a b y')
  })

  test('tag and attribute names are case-insensitive', () => {
    expect(textOf('<P>a</P><SCRIPT>no</SCRIPT ><STYLE>no</STYLE>b<A HREF="/u">c</A>')).toBe(
      'a\nb c <https://example.com/u>',
    )
  })

  test('unterminated constructs end quietly', () => {
    expect(textOf('<p>before</p><script>alert(1)')).toBe('before')
    expect(textOf('a<!-- never closed <p>b')).toBe('a')
    expect(textOf('a<svg><g>b')).toBe('a')
    expect(textOf('a<noscript>b')).toBe('a')
    expect(textOf('a <b')).toBe('a')
    expect(textOf('a <a href="/x')).toBe('a')
    expect(textOf('a <![CDATA[b')).toBe('a b')
  })

  test('an unclosed head ends where the body starts', () => {
    expect(textOf('<html><head><title>t</title><meta charset=utf-8><body><p>hi</p>')).toBe('hi')
  })

  test('nested svg and a self-closing svg are skipped whole', () => {
    expect(textOf('a<svg><svg>x</svg>y</svg>b<svg/>c')).toBe('a b c')
  })

  test('a literal less-than that starts no tag is text', () => {
    expect(textOf('a < b and 3<4 and <3')).toBe('a < b and 3<4 and <3')
  })

  test('a doctype, a processing instruction and a CDATA section outside a script', () => {
    expect(textOf('<!DOCTYPE html><?xml version="1.0"?><p>x</p><![CDATA[a > b]]>')).toBe('x\na > b')
  })

  test('a page address that is not a URL drops relative links and keeps absolute ones', () => {
    expect(
      Page.htmlToText('<a href="/x">rel</a> <a href="https://a.example/y">abs</a>', 'not a url'),
    ).toBe('rel abs <https://a.example/y>')
  })

  test('invisible and control characters are removed', () => {
    expect(textOf('a​b\u0000c\u0007d﻿e')).toBe('abcde')
  })

  test('text never exceeds the cap, and a cut falls on a line boundary', () => {
    const cut = Page.htmlToText(Fixtures.ANTHROPIC_NEWS_HTML, Fixtures.ANTHROPIC_NEWS_URL, 500)

    expect(cut.length).toBeLessThanOrEqual(500)
    expect(cut.length).toBeGreaterThan(250)
    expect(news.startsWith(cut)).toBe(true)
    expect(news.slice(cut.length)).toMatch(/^\n/)
    expect(cut.match(/</g)?.length).toBe(cut.match(/>/g)?.length)
  })

  test('a cut inside a line backs up to the previous line end unless that loses over half', () => {
    const lines = '<p>aaaa</p>'.repeat(10)

    expect(Page.htmlToText(lines, PAGE, 12)).toBe('aaaa\naaaa')
    expect(Page.htmlToText(lines, PAGE, 14)).toBe('aaaa\naaaa\naaaa')
    expect(Page.htmlToText(`<p>ab</p><p>${'x'.repeat(100)}</p>`, PAGE, 20)).toBe(
      `ab\n${'x'.repeat(17)}`,
    )
  })

  test('a very long page is cut to the default cap', () => {
    const long = `<p>${'word '.repeat(200_000)}</p>`
    const links = '<a href="/a">link text</a> '.repeat(50_000)

    expect(textOf(long).length).toBeLessThanOrEqual(Page.PAGE_TEXT_CAP)
    expect(textOf(long).length).toBeGreaterThan(Page.PAGE_TEXT_CAP - 10)
    expect(textOf(links).length).toBeLessThanOrEqual(Page.PAGE_TEXT_CAP)
    expect(Page.PAGE_TEXT_CAP).toBe(30_000)
  })

  test('whitespace-only padding does not eat the cap', () => {
    const padded = `${'<p> </p>\n'.repeat(100_000)}<p>the headline</p>`

    expect(textOf(padded)).toBe('the headline')
  })

  test('a cut never splits a surrogate pair', () => {
    const text = Page.htmlToText('😀'.repeat(100), PAGE, 51)

    expect(text.length).toBe(50)
    expect(text).not.toMatch(unpairedSurrogate)
  })

  test('empty and tag-only input give an empty string', () => {
    expect(textOf('')).toBe('')
    expect(textOf('<div><p></p></div>')).toBe('')
    expect(textOf('   \n\t ')).toBe('')
  })

  test('injected instructions stay as plain text and gain no target', () => {
    const text = textOf(Fixtures.INJECTION_PAGE_HTML)

    expect(text).toContain('IGNORE PREVIOUS INSTRUCTIONS')
    expect(text).toContain('A real headline <https://example.com/news/real>')
    expect(text).not.toContain('evil.example>')
  })
})
