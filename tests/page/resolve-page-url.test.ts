import { describe, expect, test } from 'claude-code/testing'

import Page from '../../hooks/page'

const PAGE = 'https://example.com/blog/index.html'

describe('resolve-page-url', () => {
  test('an absolute http(s) address is kept and normalized', () => {
    expect(Page.resolvePageUrl('https://other.example/a?b=1&c=2', PAGE)).toBe(
      'https://other.example/a?b=1&c=2',
    )
    expect(Page.resolvePageUrl('  http://other.example  ', PAGE)).toBe('http://other.example/')
  })

  test('relative and protocol-relative addresses resolve against the page', () => {
    expect(Page.resolvePageUrl('/news/foo', PAGE)).toBe('https://example.com/news/foo')
    expect(Page.resolvePageUrl('post.html', PAGE)).toBe('https://example.com/blog/post.html')
    expect(Page.resolvePageUrl('../up', PAGE)).toBe('https://example.com/up')
    expect(Page.resolvePageUrl('?page=2', PAGE)).toBe('https://example.com/blog/index.html?page=2')
    expect(Page.resolvePageUrl('//cdn.example.org/x', PAGE)).toBe('https://cdn.example.org/x')
    expect(Page.resolvePageUrl('//cdn.example.org/x', 'http://example.com/')).toBe(
      'http://cdn.example.org/x',
    )
  })

  test('other schemes are dropped', () => {
    for (const href of [
      'javascript:alert(1)',
      'JavaScript:alert(1)',
      ' javascript:alert(1)',
      'mailto:a@b.c',
      'tel:+15550100',
      'data:text/html,<b>x</b>',
      'file:///etc/passwd',
      'ftp://example.com/x',
      'blob:https://example.com/id',
      'localhost:3000/x',
    ]) {
      expect(Page.resolvePageUrl(href, PAGE)).toBeUndefined()
    }
  })

  test('same-page fragments and empty links are dropped, fragments on a path are kept', () => {
    expect(Page.resolvePageUrl('#top', PAGE)).toBeUndefined()
    expect(Page.resolvePageUrl('', PAGE)).toBeUndefined()
    expect(Page.resolvePageUrl('   ', PAGE)).toBeUndefined()
    expect(Page.resolvePageUrl('/changelog#v2', PAGE)).toBe('https://example.com/changelog#v2')
  })

  test('with a page address that is not a URL only absolute links survive', () => {
    expect(Page.resolvePageUrl('/x', 'not a url')).toBeUndefined()
    expect(Page.resolvePageUrl('https://a.example/y', 'not a url')).toBe('https://a.example/y')
  })

  test('characters that could end a bracketed address are percent-encoded', () => {
    expect(Page.resolvePageUrl('/a b>c<d', PAGE)).toBe('https://example.com/a%20b%3Ec%3Cd')
  })
})
