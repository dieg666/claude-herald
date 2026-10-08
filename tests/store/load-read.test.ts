import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('load-read', () => {
  test('the stored read ids by source; a store from before read ids reads as none', async () => {
    expect(await Store.loadRead(Fixtures.fakeHostOf({ read: { a: ['a:1'] } }).host)).toEqual({
      a: ['a:1'],
    })
    expect(await Store.loadRead(Fixtures.fakeHostOf().host)).toEqual({})
  })

  test('anything that is not a list of ids is dropped', async () => {
    const { host } = Fixtures.fakeHostOf({ read: { a: ['a:1', 2, null], b: 'b:1', c: {} } })

    expect(await Store.loadRead(host)).toEqual({ a: ['a:1'] })
    expect(await Store.loadRead(Fixtures.fakeHostOf({ read: ['a:1'] }).host)).toEqual({})
  })
})
