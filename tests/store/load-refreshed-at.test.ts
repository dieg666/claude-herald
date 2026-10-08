import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('load-refreshed-at', () => {
  test('the stored times by source id', async () => {
    const { host } = Fixtures.fakeHostOf({ refreshedAt: { a: 1, b: 2 } })

    expect(await Store.loadRefreshedAt(host)).toEqual({ a: 1, b: 2 })
  })

  test('nothing stored, a value that is not a record, and entries that are not times give none', async () => {
    expect(await Store.loadRefreshedAt(Fixtures.fakeHostOf().host)).toEqual({})
    expect(await Store.loadRefreshedAt(Fixtures.fakeHostOf({ refreshedAt: 'x' }).host)).toEqual({})
    expect(
      await Store.loadRefreshedAt(
        Fixtures.fakeHostOf({ refreshedAt: { a: '1', b: null, c: 3 } }).host,
      ),
    ).toEqual({ c: 3 })
  })
})
