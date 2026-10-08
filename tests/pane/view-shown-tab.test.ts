import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('view-shown-tab', () => {
  test('records the source tab the pane shows as viewed; the All tab, shown when it names none, records nothing', async () => {
    const { host, stored } = Fixtures.fakeHostOf()

    await host.state.sources.update(() => [Fixtures.sourceAt('a'), Fixtures.sourceAt('b')])
    await host.state.items.update(() => ({
      a: Fixtures.datedItemsOf('a', 1),
      b: Fixtures.datedItemsOf('b', 1),
    }))

    await Pane.viewShownTab(host)

    expect(stored.get('viewed')).toBeUndefined()

    await host.state.pane.update(() => ({ tab: 'b', selected: 0 }))
    await Pane.viewShownTab(host)

    expect(stored.get('viewed')).toEqual({ b: ['b:1'] })
  })

  test('a failing state read is logged, never thrown', async () => {
    const { host, logs } = Fixtures.fakeHostOf()

    host.state.pane.read = async () => {
      throw new Error('no state')
    }

    await Pane.viewShownTab(host)

    expect(logs).toEqual(['herald: pane: no state'])
  })
})
