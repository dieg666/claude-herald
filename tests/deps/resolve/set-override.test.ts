import { describe, expect, test } from 'claude-code/testing'

import Resolve from '../../../hooks/deps/resolve'
import Fixtures from '../../fixtures'

describe('set-override', () => {
  test('stores an owner/repo or a feed URL under the package, stamped with the clock', async () => {
    const { host, stored } = Fixtures.fakeHostOf({
      depFeeds: { 'npm:other': { repo: 'o/other', resolvedAt: 5 } },
    })

    expect(await Resolve.setOverride(host, Fixtures.depAt('react'), 'facebook/react')).toEqual({
      repo: 'facebook/react',
      resolvedAt: 1000,
      isOverride: true,
    })
    await Resolve.setOverride(
      host,
      { ecosystem: 'pypi', name: 'requests' },
      'https://example.com/feed.xml',
    )

    expect(stored.get('depFeeds')).toEqual({
      'npm:other': { repo: 'o/other', resolvedAt: 5 },
      'npm:react': { repo: 'facebook/react', resolvedAt: 1000, isOverride: true },
      'pypi:requests': { feed: 'https://example.com/feed.xml', resolvedAt: 1000, isOverride: true },
    })
  })

  test('a target that is neither a repository nor a URL stores nothing', async () => {
    const { host, sets } = Fixtures.fakeHostOf()

    expect(await Resolve.setOverride(host, Fixtures.depAt('react'), 'not a target')).toBeUndefined()
    expect(sets).toEqual([])
  })
})
