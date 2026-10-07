import { describe, expect, test } from 'claude-code/testing'

import Resolve from '../../../hooks/deps/resolve'
import Fixtures from '../../fixtures'

describe('clear-override', () => {
  test("drops the package's override and keeps the rest", async () => {
    const { host, stored } = Fixtures.fakeHostOf({
      depFeeds: {
        'npm:react': { repo: 'fork/react', resolvedAt: 1, isOverride: true },
        'npm:vue': { repo: 'vuejs/core', resolvedAt: 2 },
      },
    })

    expect(await Resolve.clearOverride(host, Fixtures.depAt('react'))).toBe(true)
    expect(stored.get('depFeeds')).toEqual({ 'npm:vue': { repo: 'vuejs/core', resolvedAt: 2 } })
  })

  test('a looked-up mapping is not an override and stays', async () => {
    const { host, sets } = Fixtures.fakeHostOf({
      depFeeds: { 'npm:vue': { repo: 'vuejs/core', resolvedAt: 2 } },
    })

    expect(await Resolve.clearOverride(host, Fixtures.depAt('vue'))).toBe(false)
    expect(sets).toEqual([])
  })
})
