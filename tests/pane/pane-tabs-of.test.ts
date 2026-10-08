import { describe, expect, test } from 'claude-code/testing'

import Names from '../../hooks/names'
import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('pane-tabs-of', () => {
  test('enabled sources in order with digits, then Saved on 0', () => {
    expect(
      Pane.paneTabsOf([
        Fixtures.sourceAt('a', { name: 'Alpha' }),
        Fixtures.sourceAt('off', { isEnabled: false }),
        Fixtures.sourceAt('b', { name: 'Beta' }),
      ]),
    ).toEqual([
      { id: 'a', label: 'Alpha', hotkey: '1' },
      { id: 'b', label: 'Beta', hotkey: '2' },
      { id: 'saved', label: 'Saved', hotkey: '0' },
    ])
  })

  test('no sources leaves the saved tab alone', () => {
    expect(Pane.paneTabsOf([])).toEqual([{ id: 'saved', label: 'Saved', hotkey: '0' }])
  })

  test('the tenth source on gets no hotkey', () => {
    const tabs = Pane.paneTabsOf(Array.from({ length: 11 }, (_, i) => Fixtures.sourceAt(`s${i}`)))

    expect(tabs.map(tab => tab.hotkey)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      undefined,
      undefined,
      '0',
    ])
  })

  test('a source whose id is the saved tab never gets a tab of its own', () => {
    expect(
      Pane.paneTabsOf([Fixtures.sourceAt('saved'), Fixtures.sourceAt('a')]).map(tab => tab.id),
    ).toEqual(['a', 'saved'])
  })

  test('names become one line cut to sixteen cells, wide characters counting two; a blank name shows the id', () => {
    const [long, edge, wide, blank] = Pane.paneTabsOf([
      Fixtures.sourceAt('long', { name: 'Claude Code\nreleases' }),
      Fixtures.sourceAt('edge', { name: 'AINews (smol.ai)' }),
      Fixtures.sourceAt('wide', { name: '日本語のニュースサイト' }),
      Fixtures.sourceAt('blank', { name: ' \u0007 ' }),
    ])

    expect(Pane.PANE_TAB_COLUMNS).toBe(16)
    expect(long?.label).toBe('Claude Code rel…')
    expect(edge?.label).toBe('AINews (smol.ai)')
    expect(wide?.label).toBe('日本語のニュー…')
    expect(blank?.label).toBe('blank')
  })

  test('the stack tab counts its packages behind and Saved its items; no count for none', () => {
    const sources = [Fixtures.sourceAt('a', { name: 'Alpha' })]
    const stack = { items: Fixtures.STACK_RELEASES, filter: 'nothing matches', expanded: [] }
    const saved = [1, 2].map(n => ({ ...Fixtures.itemAt(`k${n}`), savedAt: n }))

    expect(Pane.paneTabsOf(sources, stack, saved).map(tab => [tab.id, tab.count])).toEqual([
      ['a', undefined],
      ['@stack', 7],
      ['saved', 2],
    ])
    expect(
      Pane.paneTabsOf(sources, { ...stack, items: [] }, []).map(tab => Object.hasOwn(tab, 'count')),
    ).toEqual([false, false, false])
  })

  test('the stack tab, when there is one, comes before Saved on y, a hotkey no other pane Button takes', () => {
    const tabs = Pane.paneTabsOf([Fixtures.sourceAt('a', { name: 'Alpha' })], {
      items: [],
      filter: '',
      expanded: [],
    })

    expect(tabs).toEqual([
      { id: 'a', label: 'Alpha', hotkey: '1' },
      { id: '@stack', label: 'Your stack', hotkey: 'y' },
      { id: 'saved', label: 'Saved', hotkey: '0' },
    ])

    const others = [...Object.values(Names.PANE_HOTKEYS), ...Object.values(Names.ACTION_HOTKEYS)]

    expect(others.filter(key => key === 'y').length).toBe(1)
    expect(new Set(others).size).toBe(others.length)
  })
})
