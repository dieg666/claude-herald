import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('save-dep-feeds', () => {
  test('merges into what the store holds now', async () => {
    const { host, stored } = Fixtures.fakeHostOf({
      depFeeds: { 'npm:a': { repo: 'o/a', resolvedAt: 1 } },
    })

    await Store.saveDepFeeds(host, { 'npm:b': { reason: 'none', resolvedAt: 2 } })

    expect(stored.get('depFeeds')).toEqual({
      'npm:a': { repo: 'o/a', resolvedAt: 1 },
      'npm:b': { reason: 'none', resolvedAt: 2 },
    })
  })

  test('past the cap the oldest looked-up mappings go and overrides always stay', async () => {
    const feeds = Object.fromEntries(
      Array.from({ length: Store.DEP_FEEDS_MAX }, (_, index) => [
        `npm:p${index}`,
        { repo: `o/p${index}`, resolvedAt: index + 10 },
      ]),
    )
    const { host, stored } = Fixtures.fakeHostOf({
      depFeeds: { ...feeds, 'npm:pinned': { feed: 'https://f', resolvedAt: 0, isOverride: true } },
    })

    await Store.saveDepFeeds(host, { 'npm:new': { repo: 'o/new', resolvedAt: 10_000 } })

    const kept = Store.depFeedsOf(stored.get('depFeeds'))

    expect(Store.DEP_FEEDS_MAX).toBe(500)
    expect(Object.keys(kept).length).toBe(501)
    expect(kept['npm:pinned']?.isOverride).toBe(true)
    expect(kept['npm:new']).toEqual({ repo: 'o/new', resolvedAt: 10_000 })
    expect(kept['npm:p0']).toBeUndefined()
    expect(kept['npm:p1']).toBeDefined()
  })

  test('an override set or cleared meanwhile is never overwritten by a lookup', async () => {
    const { host, stored } = Fixtures.fakeHostOf({
      depFeeds: { 'npm:a': { repo: 'fork/a', resolvedAt: 1, isOverride: true } },
    })

    await Store.saveDepFeeds(host, {
      'npm:a': { repo: 'o/a', feed: 'https://github.com/o/a/releases.atom', resolvedAt: 2 },
      'npm:b': { repo: 'fork/b', feed: 'https://f', resolvedAt: 2, isOverride: true },
    })

    expect(stored.get('depFeeds')).toEqual({
      'npm:a': { repo: 'fork/a', resolvedAt: 1, isOverride: true },
    })
  })

  test('a repository override takes its checked feed', async () => {
    const { host, stored } = Fixtures.fakeHostOf({
      depFeeds: { 'npm:a': { repo: 'fork/a', resolvedAt: 1, isOverride: true } },
    })
    const checked = {
      repo: 'fork/a',
      feed: 'https://github.com/fork/a/tags.atom',
      resolvedAt: 2,
      isOverride: true,
    }

    await Store.saveDepFeeds(host, { 'npm:a': checked })

    expect(stored.get('depFeeds')).toEqual({ 'npm:a': checked })
  })

  test('stored entries that are not mappings are dropped on read', () => {
    expect(
      Store.depFeedsOf({
        'npm:a': { repo: ' o/a ', feed: '', resolvedAt: 3, isOverride: 'yes' },
        'npm:b': { repo: 'o/b' },
        'npm:c': 'text',
      }),
    ).toEqual({ 'npm:a': { repo: 'o/a', resolvedAt: 3 } })
    expect(Store.depFeedsOf(['x'])).toEqual({})
  })
})
