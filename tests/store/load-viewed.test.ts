import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('load-viewed', () => {
  test('the stored viewed ids by source; a store from before viewed ids reads as none', async () => {
    expect(await Store.loadViewed(Fixtures.fakeHostOf({ viewed: { a: [] } }).host)).toEqual({
      a: [],
    })
    expect(await Store.loadViewed(Fixtures.fakeHostOf().host)).toEqual({})
  })

  test('anything that is not a list of ids is dropped', async () => {
    const { host } = Fixtures.fakeHostOf({ viewed: { a: ['a:1', 3], b: 7 } })

    expect(await Store.loadViewed(host)).toEqual({ a: ['a:1'] })
  })
})
