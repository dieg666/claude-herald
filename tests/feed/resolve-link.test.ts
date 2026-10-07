import { describe, expect, test } from 'claude-code/testing'

import Feed from '../../hooks/feed'

describe('resolve-link', () => {
  test('an absolute http(s) link is kept as written', () => {
    expect(Feed.resolveLink(' https://example.com/a?b=1&c=2 ')).toBe(
      'https://example.com/a?b=1&c=2',
    )
    expect(Feed.resolveLink('http://simonwillison.net')).toBe('http://simonwillison.net')
  })

  test('a relative link resolves against the base, and is dropped without one', () => {
    expect(Feed.resolveLink('posts/3', 'https://example.org/blog/')).toBe(
      'https://example.org/blog/posts/3',
    )
    expect(Feed.resolveLink('//cdn.example.org/x', 'https://example.org/')).toBe(
      'https://cdn.example.org/x',
    )
    expect(Feed.resolveLink('posts/3')).toBeUndefined()
  })

  test('other schemes and empty links are dropped', () => {
    for (const href of [
      'javascript:alert(1)',
      'data:text/html,x',
      'mailto:a@b.c',
      'file:///etc/passwd',
      '',
      '   ',
      undefined,
    ]) {
      expect(Feed.resolveLink(href, 'https://example.org/')).toBeUndefined()
    }
  })
})
