import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('save-refreshed-at', () => {
  test('merges the sources at that time into what the store holds, and returns it', async () => {
    const { host, stored } = Fixtures.fakeHostOf({ refreshedAt: { a: 1, b: 2 } })

    expect(await Store.saveRefreshedAt(host, ['b', 'c'], 9)).toEqual({ a: 1, b: 9, c: 9 })
    expect(stored.get('refreshedAt')).toEqual({ a: 1, b: 9, c: 9 })
    expect(await Store.loadRefreshedAt(host)).toEqual({ a: 1, b: 9, c: 9 })
  })

  test('no source writes nothing', async () => {
    const { host, sets } = Fixtures.fakeHostOf({ refreshedAt: { a: 1 } })

    expect(await Store.saveRefreshedAt(host, [], 9)).toEqual({ a: 1 })
    expect(sets).toEqual([])
  })
})
