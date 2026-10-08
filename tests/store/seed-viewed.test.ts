import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('seed-viewed', () => {
  test('gives a source without viewed ids its first, keeping the other sources', async () => {
    const { host, stored } = Fixtures.fakeHostOf({ viewed: { b: ['b:1'] } })

    expect(await Store.seedViewed(host, 'a', ['a:2', 'a:1'])).toEqual({
      a: ['a:2', 'a:1'],
      b: ['b:1'],
    })
    expect(stored.get('viewed')).toEqual({ a: ['a:2', 'a:1'], b: ['b:1'] })
  })

  test('a source that has viewed ids, even none, keeps them', async () => {
    const { host, sets } = Fixtures.fakeHostOf({ viewed: { a: [] } })

    expect(await Store.seedViewed(host, 'a', ['a:1'])).toBeUndefined()
    expect(sets).toEqual([])
  })

  test('no ids writes nothing, so a source that loaded empty gets its baseline later', async () => {
    const { host, sets } = Fixtures.fakeHostOf()

    expect(await Store.seedViewed(host, 'a', [])).toBeUndefined()
    expect(sets).toEqual([])
  })
})
