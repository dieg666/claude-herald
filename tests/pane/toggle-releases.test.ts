import { describe, expect, test } from 'claude-code/testing'

import type { StackState } from '../../types/index.js'
import Pane from '../../hooks/pane'
import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('toggle-releases', () => {
  const setUp = (selected: number, tab = '@stack') => {
    const fake = Fixtures.fakeHostOf()

    fake.state.stack = {
      root: '/repo',
      settings: Store.depsSettingsOf({ showLevel: 'all' }),
      items: Fixtures.STACK_RELEASES,
      filter: '',
    } satisfies StackState
    fake.state.pane = { tab, selected }

    return fake
  }

  test('expands the selected package and hides it again from one of its releases, the selection back on its row', async () => {
    const { host, state } = setUp(1)
    const shown: string[][] = []
    const onShown = async (_: unknown, items: readonly { id: string }[]) => {
      shown.push(items.map(item => item.id))
    }

    expect(await Pane.toggleReleases(host, 20, onShown)).toBeUndefined()
    expect((state.stack as StackState).expanded).toEqual(['npm:jsdom'])
    expect(state.pane).toEqual({ tab: '@stack', selected: 1 })

    state.pane = { tab: '@stack', selected: 3 }

    await Pane.toggleReleases(host, 20, onShown)

    expect((state.stack as StackState).expanded).toEqual([])
    expect(state.pane).toEqual({ tab: '@stack', selected: 1 })
    expect(shown).toEqual([])
  })

  test('hands the items shown over when the window changes; does nothing on another tab or an empty one', async () => {
    const { host, state } = setUp(1)
    const shown: string[][] = []
    const onShown = async (_: unknown, items: readonly { id: string }[]) => {
      shown.push(items.map(item => item.id))
    }

    state.stack = { ...(state.stack as StackState), expanded: ['npm:jsdom'] }
    state.pane = { tab: '@stack', selected: 4 }

    // Six lines less the summary, the filter and two headings leave two rows: two of jsdom's releases, then @astrojs/node and jsdom.
    const items = await Pane.toggleReleases(host, 3, onShown)
    const ids = Fixtures.STACK_RELEASES.filter(item =>
      ['@astrojs/node', 'jsdom'].includes(item.release.name),
    ).map(item => item.id)

    expect(state.pane).toEqual({ tab: '@stack', selected: 1 })
    expect(items?.map(item => item.id)).toEqual(ids)
    expect(shown).toEqual([ids])

    const other = setUp(0, 'saved')

    expect(await Pane.toggleReleases(other.host, 20, onShown)).toBeUndefined()
    expect((other.state.stack as StackState).expanded).toBeUndefined()

    const empty = setUp(0)

    empty.state.stack = { ...(empty.state.stack as StackState), items: [] }

    expect(await Pane.toggleReleases(empty.host, 20, onShown)).toBeUndefined()
    expect((empty.state.stack as StackState).expanded).toBeUndefined()
  })
})
