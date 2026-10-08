import { describe, expect, test } from 'claude-code/testing'

import type { Item } from '../../types/index.js'
import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('hand-shown-pane', () => {
  test('hands the window the pane shows now, the saved tab included', async () => {
    const { host } = Fixtures.fakeHostOf()
    const shown: string[][] = []
    const onShown = async (_: unknown, items: readonly Item[]) => {
      shown.push(items.map(item => item.id))
    }

    await host.state.sources.update(() => [Fixtures.sourceAt('a')])
    await host.state.items.update(() => ({ a: Fixtures.datedItemsOf('a', 5) }))
    await host.state.saved.update(() => [{ ...Fixtures.itemAt('kept'), savedAt: 1 }])

    expect((await Pane.handShownPane(host, 3, onShown)).map(item => item.id)).toEqual([
      'a:1',
      'a:2',
      'a:3',
    ])

    await host.state.pane.update(() => ({ tab: 'saved', selected: 0 }))
    await Pane.handShownPane(host, 3, onShown)

    expect(shown).toEqual([['a:1', 'a:2', 'a:3'], ['src:kept']])
  })

  test('an empty tab hands nothing; a failure is logged, never thrown', async () => {
    const { host, logs } = Fixtures.fakeHostOf()
    let calls = 0
    const onShown = async () => {
      calls += 1
    }

    expect(await Pane.handShownPane(host, 3, onShown)).toEqual([])
    expect(calls).toBe(0)

    host.state.items.read = async () => {
      throw new Error('no state')
    }

    expect(await Pane.handShownPane(host, 3, onShown)).toEqual([])
    expect(logs).toEqual(['news: pane: no state'])
  })
})
