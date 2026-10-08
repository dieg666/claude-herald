import { describe, expect, test } from 'claude-code/testing'

import type { Item } from '../../types/index.js'
import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('move-pane', () => {
  const paneWith = async () => {
    const fake = Fixtures.fakeHostOf()
    const shown: string[][] = []
    const onShown = async (host: unknown, items: readonly Item[]) => {
      shown.push(items.map(item => item.id))
    }

    await fake.host.state.sources.update(() => [Fixtures.sourceAt('a'), Fixtures.sourceAt('b')])
    await fake.host.state.items.update(() => ({
      a: Fixtures.datedItemsOf('a', 6),
      b: Fixtures.datedItemsOf('b', 1),
    }))

    return { ...fake, shown, onShown }
  }

  test('a tab switch writes the pane and hands the new tab over once', async () => {
    const { host, state, shown, onShown } = await paneWith()

    expect(await Pane.movePane(host, { tab: 'b' }, 4, onShown)).toEqual(
      Fixtures.datedItemsOf('b', 1),
    )
    expect(state.pane).toEqual({ tab: 'b', selected: 0 })
    expect(shown).toEqual([['b:1']])

    expect(await Pane.movePane(host, { tab: 'b' }, 4, onShown)).toBeUndefined()
    expect(shown.length).toBe(1)
  })

  test('a move inside the window writes the selection and hands the selected item alone when it has no summary; one that moves the window hands it, the selected item first', async () => {
    const { host, state, shown, onShown } = await paneWith()

    await host.state.pane.update(() => ({ tab: 'a', selected: 0 }))
    await host.state.summaries.update(() => ({ 'a:3': 'Kept.' }))

    expect(await Pane.movePane(host, 'down', 4, onShown)).toBeUndefined()
    expect(await Pane.movePane(host, 'down', 4, onShown)).toBeUndefined()
    expect(state.pane).toEqual({ tab: 'a', selected: 2 })
    expect(shown).toEqual([['a:2']])

    expect((await Pane.movePane(host, 'down', 4, onShown))?.map(item => item.id)).toEqual([
      'a:2',
      'a:3',
      'a:4',
      'a:5',
    ])
    expect(shown).toEqual([['a:2'], ['a:4', 'a:2', 'a:3', 'a:5']])
  })

  test('a move inside the window to an item without text hands nothing', async () => {
    const { host, shown, onShown } = await paneWith()

    await host.state.pane.update(() => ({ tab: 'a', selected: 0 }))
    await host.state.items.update(items => ({
      ...items,
      a: (items.a ?? []).map(item => (item.id === 'a:2' ? { ...item, text: '' } : item)),
    }))

    expect(await Pane.movePane(host, 'down', 4, onShown)).toBeUndefined()
    expect(shown).toEqual([])
  })

  test('a tab switch records the tab left and the tab shown as viewed; a move within a tab does not', async () => {
    const { host, stored, state, onShown } = await paneWith()

    await host.state.pane.update(() => ({ tab: 'a', selected: 0 }))
    await Pane.movePane(host, 'down', 4, onShown)

    expect(stored.get('viewed')).toBeUndefined()

    await Pane.movePane(host, { tab: 'b' }, 4, onShown)

    const viewed = {
      a: Fixtures.datedItemsOf('a', 6).map(item => item.id),
      b: ['b:1'],
    }

    expect(stored.get('viewed')).toEqual(viewed)
    expect(state.viewed).toEqual(viewed)

    await Pane.movePane(host, { tab: 'saved' }, 4, onShown)

    expect(stored.get('viewed')).toEqual(viewed)
  })

  test('the pane starts on All, which moves like a news tab over every source and is never recorded as viewed; leaving it records only the tab shown', async () => {
    const { host, stored, state, shown, onShown } = await paneWith()

    expect(await Pane.movePane(host, 'down', 4, onShown)).toBeUndefined()
    expect(state.pane).toEqual({ tab: '@all', selected: 1 })
    expect(shown).toEqual([['b:1']])
    expect(stored.get('viewed')).toBeUndefined()

    await Pane.movePane(host, { tab: 'b' }, 4, onShown)

    expect(stored.get('viewed')).toEqual({ b: ['b:1'] })

    await Pane.movePane(host, { tab: '@all' }, 4, onShown)

    expect(state.pane).toEqual({ tab: '@all', selected: 0 })
    expect(stored.get('viewed')).toEqual({ b: ['b:1'] })
  })

  test('a move that changes nothing writes nothing', async () => {
    const { host, state, shown, onShown } = await paneWith()

    await host.state.pane.update(() => ({ tab: 'a', selected: 0 }))

    const before = state.pane

    expect(await Pane.movePane(host, 'up', 4, onShown)).toBeUndefined()
    expect(state.pane).toBe(before)
    expect(shown).toEqual([])
  })

  test('a failing state read or summary is logged, never thrown', async () => {
    const { host, logs } = await paneWith()

    expect(
      await Pane.movePane(host, { tab: 'b' }, 4, async () => {
        throw new Error('model down')
      }),
    ).toEqual(Fixtures.datedItemsOf('b', 1))

    host.state.pane.read = async () => {
      throw new Error('no state')
    }

    expect(await Pane.movePane(host, 'down', 4, async () => undefined)).toBeUndefined()
    expect(logs).toEqual(['herald: pane: model down', 'herald: pane: could not move: no state'])
  })
})
