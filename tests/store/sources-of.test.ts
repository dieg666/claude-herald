import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'

describe('sources-of', () => {
  const SOURCE = {
    id: 'x',
    name: 'X',
    url: 'https://x.test/feed',
    kind: 'feed',
    isEnabled: false,
    icon: 'X',
    isFactory: false,
  }

  test('undefined when nothing was stored or the value is not a list', () => {
    expect(Store.sourcesOf(undefined)).toBeUndefined()
    expect(Store.sourcesOf({ sources: [] })).toBeUndefined()
  })

  test('drops entries that are not a source and keeps known fields only', () => {
    expect(
      Store.sourcesOf([{ ...SOURCE, extra: 1 }, { id: 'y' }, 'z', { ...SOURCE, kind: 'video' }]),
    ).toEqual([SOURCE])
  })

  test('keeps a fallback URL', () => {
    expect(Store.sourcesOf([{ ...SOURCE, fallbackUrl: 'https://x.test/rss' }])).toEqual([
      { ...SOURCE, fallbackUrl: 'https://x.test/rss' },
    ])
  })
})
