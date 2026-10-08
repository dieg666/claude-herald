import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('view-tabs', () => {
  const withItems = async (entries: Record<string, unknown> = {}) => {
    const fake = Fixtures.fakeHostOf(entries)

    await fake.host.state.items.update(() => ({
      a: Fixtures.datedItemsOf('a', 2),
      b: Fixtures.datedItemsOf('b', 1),
    }))

    return fake
  }

  test('records the items each source tab holds as viewed in the store and state, keeping the older ids', async () => {
    const { host, stored, state } = await withItems({ viewed: { a: ['a:0'], c: ['c:1'] } })

    await Pane.viewTabs(host, ['a', 'b', 'a'])

    const viewed = { a: ['a:1', 'a:2', 'a:0'], b: ['b:1'], c: ['c:1'] }

    expect(stored.get('viewed')).toEqual(viewed)
    expect(state.viewed).toEqual(viewed)
  })

  test('the stack and saved tabs and a source with no items in state are skipped', async () => {
    const { host, sets } = await withItems()

    await Pane.viewTabs(host, ['@stack', 'saved', 'gone'])

    expect(sets).toEqual([])
  })

  test('a store that fails is logged to debug, not thrown', async () => {
    const { host, logs } = await withItems()

    host.storeSet = async () => {
      throw new Error('read-only')
    }

    await Pane.viewTabs(host, ['a'])

    expect(logs).toEqual(['herald: pane: could not record the tab as viewed: read-only'])
  })
})
