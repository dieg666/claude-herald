import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('view-shown-tab', () => {
  test('records the source tab the pane shows as viewed', async () => {
    const { host, stored } = Fixtures.fakeHostOf()

    await host.state.sources.update(() => [Fixtures.sourceAt('a'), Fixtures.sourceAt('b')])
    await host.state.items.update(() => ({
      a: Fixtures.datedItemsOf('a', 1),
      b: Fixtures.datedItemsOf('b', 1),
    }))

    await host.state.pane.update(() => ({ tab: 'b', selected: 0 }))
    await Pane.viewShownTab(host, 4)

    expect(stored.get('viewed')).toEqual({ b: ['b:1'] })
  })

  test('the All tab, shown when the pane names none, records per source the rows of its window of that size, and only for sources with a baseline', async () => {
    const { host, stored, state } = Fixtures.fakeHostOf({ viewed: { a: ['a:9'], b: ['b:9'] } })

    await host.state.sources.update(() => [
      Fixtures.sourceAt('a'),
      Fixtures.sourceAt('b'),
      Fixtures.sourceAt('c'),
    ])
    await host.state.items.update(() => ({
      a: Fixtures.datedItemsOf('a', 3),
      b: Fixtures.datedItemsOf('b', 3),
      c: Fixtures.datedItemsOf('c', 3),
    }))

    // The band's order mixes the sources: a:1, b:1, c:1, a:2, b:2, c:2, ...
    await Pane.viewShownTab(host, 4)

    const viewed = { a: ['a:1', 'a:2', 'a:9'], b: ['b:1', 'b:9'] }

    expect(stored.get('viewed')).toEqual(viewed)
    expect(state.viewed).toEqual(viewed)
  })

  test('a failing state read is logged, never thrown', async () => {
    const { host, logs } = Fixtures.fakeHostOf()

    host.state.pane.read = async () => {
      throw new Error('no state')
    }

    await Pane.viewShownTab(host, 4)

    expect(logs).toEqual(['herald: pane: no state'])
  })
})
