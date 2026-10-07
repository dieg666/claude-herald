import { describe, expect, test } from 'claude-code/testing'

import Resolve from '../../../hooks/deps/resolve'

describe('override-target-of', () => {
  for (const [target, parsed] of [
    ['facebook/react', { repo: 'facebook/react' }],
    ['  facebook/react  ', { repo: 'facebook/react' }],
    ['https://github.com/facebook/react', { repo: 'facebook/react' }],
    ['https://github.com/facebook/react/tree/main', { repo: 'facebook/react' }],
    [
      'https://github.com/facebook/react/releases.atom',
      { feed: 'https://github.com/facebook/react/releases.atom' },
    ],
    ['https://blog.example.com/feed.xml', { feed: 'https://blog.example.com/feed.xml' }],
    [
      'https://gitlab.com/o/r/-/tags?format=atom',
      { feed: 'https://gitlab.com/o/r/-/tags?format=atom' },
    ],
  ] as const) {
    test(`${target.trim()} maps to ${JSON.stringify(parsed)}`, () => {
      expect(Resolve.overrideTargetOf(target)).toEqual(parsed)
    })
  }

  for (const target of ['react', 'ftp://example.com/feed', 'a/b/c', 'https://', '']) {
    test(`${target || 'an empty text'} is refused`, () => {
      expect(Resolve.overrideTargetOf(target)).toBeUndefined()
    })
  }
})
