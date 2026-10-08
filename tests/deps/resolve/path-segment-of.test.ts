import { describe, expect, test } from 'claude-code/testing'

import Resolve from '../../../hooks/deps/resolve'

describe('path-segment-of', () => {
  test('a name of letters, digits, dots, hyphens and underscores is kept as it is', () => {
    expect(Resolve.pathSegmentOf('Foo_bar-1.2')).toBe('Foo_bar-1.2')
  })

  test('anything the pattern refuses gives nothing: separators, query marks, spaces, control characters, empty', () => {
    for (const name of ['a/b', 'a?b', 'a#b', 'a b', 'a\nb', 'a%2Fb', '']) {
      expect(Resolve.pathSegmentOf(name)).toBeUndefined()
    }
  })

  test('a name of only dots would climb the path, so it gives nothing', () => {
    for (const name of ['.', '..', '...']) {
      expect(Resolve.pathSegmentOf(name)).toBeUndefined()
    }

    expect(Resolve.pathSegmentOf('a..b')).toBe('a..b')
  })

  test('what a looser pattern lets through is percent-encoded', () => {
    expect(Resolve.pathSegmentOf('a b?c#d/e', /^.+$/)).toBe('a%20b%3Fc%23d%2Fe')
  })

  test('a stricter pattern refuses a dot', () => {
    expect(Resolve.pathSegmentOf('a.b', /^[\w-]+$/)).toBeUndefined()
  })
})
