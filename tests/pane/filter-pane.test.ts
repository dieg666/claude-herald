import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'
import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('filter-pane', () => {
  test('writes the filter as one line, puts the selection back at the top and hands the items shown over', async () => {
    const { host, state } = Fixtures.fakeHostOf()
    const shown: string[][] = []

    state.stack = {
      root: '/repo',
      settings: Store.depsSettingsOf({ showLevel: 'all' }),
      items: Fixtures.STACK_SAMPLE,
      filter: '',
    }
    state.pane = { tab: '@stack', selected: 3 }

    const items = await Pane.filterPane(host, 'lod\nzzz ', 10, async (_, drawn) => {
      shown.push(drawn.map(item => item.id))
    })

    expect(state.stack).toMatchObject({ filter: 'lod zzz ' })
    expect(state.pane).toEqual({ tab: '@stack', selected: 0 })
    expect(items).toEqual([])

    await Pane.filterPane(host, 'lodash', 10, async (_, drawn) => {
      shown.push(drawn.map(item => item.id))
    })

    expect(shown).toEqual([[Fixtures.STACK_SAMPLE[2]?.id]])
  })
})
