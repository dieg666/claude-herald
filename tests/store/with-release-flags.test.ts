import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'

describe('with-release-flags', () => {
  test('a verdict is added as the newest, replacing one for the same release', () => {
    const old = [
      { releaseId: 'a', breaking: false, security: false },
      { releaseId: 'b', breaking: true, security: false },
    ]

    expect(Store.withReleaseFlags(old, { releaseId: 'a', breaking: true, security: true })).toEqual(
      [
        { releaseId: 'b', breaking: true, security: false },
        { releaseId: 'a', breaking: true, security: true },
      ],
    )
  })

  test('past the cap the oldest go first', () => {
    const entries = ['a', 'b', 'c'].map(releaseId => ({
      releaseId,
      breaking: false,
      security: false,
    }))

    expect(
      Store.withReleaseFlags(entries, { releaseId: 'd', breaking: false, security: false }, 2).map(
        entry => entry.releaseId,
      ),
    ).toEqual(['c', 'd'])
    expect(Store.withReleaseFlags(entries, entries[0]!, 0)).toEqual([])
  })

  test('the default cap is the store limit', () => {
    const entries = Array.from({ length: Store.RELEASE_FLAGS_MAX }, (_, index) => ({
      releaseId: `r${index}`,
      breaking: false,
      security: false,
    }))
    const next = Store.withReleaseFlags(entries, {
      releaseId: 'new',
      breaking: false,
      security: false,
    })

    expect(next.length).toBe(Store.RELEASE_FLAGS_MAX)
    expect(next[0]?.releaseId).toBe('r1')
  })
})
