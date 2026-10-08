import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('view-items', () => {
  test('records the items per source in the store and state, ahead of the older ids', async () => {
    const { host, stored, state } = Fixtures.fakeHostOf({ viewed: { a: ['a:9'], b: ['b:9'] } })

    await Pane.viewItems(host, [...Fixtures.datedItemsOf('a', 2), ...Fixtures.datedItemsOf('b', 1)])

    const viewed = { a: ['a:1', 'a:2', 'a:9'], b: ['b:1', 'b:9'] }

    expect(stored.get('viewed')).toEqual(viewed)
    expect(state.viewed).toEqual(viewed)
  })

  test('the stack releases and a source with no viewed ids yet are left alone', async () => {
    const { host, sets } = Fixtures.fakeHostOf({ viewed: { a: ['a:9'], '@stack': ['pkg:9'] } })
    const stack = Fixtures.stackItemAt('react', '1.0.0')

    await Pane.viewItems(host, [...Fixtures.datedItemsOf('b', 2), stack])

    expect(sets).toEqual([])
  })

  test('nothing is written when there are no items', async () => {
    const { host, sets } = Fixtures.fakeHostOf({ viewed: { a: ['a:9'] } })

    await Pane.viewItems(host, [])

    expect(sets).toEqual([])
  })

  test('a store that fails is logged to debug, not thrown', async () => {
    const { host, logs } = Fixtures.fakeHostOf({ viewed: { a: [] } })

    host.storeSet = async () => {
      throw new Error('read-only')
    }

    await Pane.viewItems(host, Fixtures.datedItemsOf('a', 1))

    expect(logs).toEqual(['herald: pane: could not record the items as viewed: read-only'])
  })
})
