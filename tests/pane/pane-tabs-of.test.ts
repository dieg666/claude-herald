import { describe, expect, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'
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
      { id: 'a', name: 'Alpha', label: 'Alpha', short: 'Alpha', hotkey: '1' },
      { id: 'b', name: 'Beta', label: 'Beta', short: 'Beta', hotkey: '2' },
      { id: 'saved', name: 'Saved', label: 'Saved', short: 'Saved', hotkey: '0' },
    ])
  })

  test('no sources leaves the saved tab alone', () => {
    expect(Pane.paneTabsOf([])).toEqual([
      { id: 'saved', name: 'Saved', label: 'Saved', short: 'Saved', hotkey: '0' },
    ])
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

  test('names become one line, kept whole and also cut to sixteen cells, wide characters counting two; a blank name shows the id', () => {
    const [long, edge, wide, blank] = Pane.paneTabsOf([
      Fixtures.sourceAt('long', { name: 'Claude Code\nreleases' }),
      Fixtures.sourceAt('edge', { name: 'AINews (smol.ai)' }),
      Fixtures.sourceAt('wide', { name: '日本語のニュースサイト' }),
      Fixtures.sourceAt('blank', { name: ' \u0007 ' }),
    ])

    expect(Pane.PANE_TAB_COLUMNS).toBe(16)
    expect([long?.label, long?.short]).toEqual(['Claude Code releases', 'Claude Code rel…'])
    expect([edge?.label, edge?.short]).toEqual(['AINews (smol.ai)', 'AINews (smol.ai)'])
    expect([wide?.label, wide?.short]).toEqual(['日本語のニュースサイト', '日本語のニュー…'])
    expect([blank?.label, blank?.short]).toEqual(['blank', 'blank'])
  })

  test('a factory source keeps its short label while it has its factory name; a renamed one and a user source show their own names', () => {
    const [code] = Defaults.FACTORY_SOURCES.filter(source => source.id === 'claude-code-releases')
    const tabs = Pane.paneTabsOf([
      code!,
      { ...code!, id: 'claude-agent-sdk-ts', name: 'Claude Agent SDK (TS)' },
      { ...code!, id: 'anthropic-sdk-python', name: 'My Python SDK' },
      Fixtures.sourceAt('mine', { name: 'Claude Code releases' }),
      Fixtures.sourceAt('agent', { name: 'Agent SDK' }),
    ])

    expect(tabs.slice(0, 5).map(tab => [tab.id, tab.name, tab.label, tab.short])).toEqual([
      ['claude-code-releases', 'Claude Code releases', 'Claude Code', 'Claude Code'],
      ['claude-agent-sdk-ts', 'Claude Agent SDK (TS)', 'Agent SDK', 'Agent SDK'],
      ['anthropic-sdk-python', 'My Python SDK', 'My Python SDK', 'My Python SDK'],
      ['mine', 'Claude Code releases', 'Claude Code releases', 'Claude Code rel…'],
      ['agent', 'Agent SDK', 'Agent SDK', 'Agent SDK'],
    ])
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

  test('a source tab counts its new items; none for zero or for a source not given', () => {
    const sources = [
      Fixtures.sourceAt('a', { name: 'Alpha' }),
      Fixtures.sourceAt('b', { name: 'Beta' }),
      Fixtures.sourceAt('c', { name: 'Gamma' }),
    ]

    expect(
      Pane.paneTabsOf(sources, undefined, [], { a: 2, b: 0, saved: 5 }).map(tab => [
        tab.id,
        tab.count,
      ]),
    ).toEqual([
      ['a', 2],
      ['b', undefined],
      ['c', undefined],
      ['saved', undefined],
    ])
    expect(Pane.paneTabTextOf(Pane.paneTabsOf(sources, undefined, [], { a: 14 })[0]!)).toBe(
      'Alpha 14',
    )
  })

  test('the stack tab, when there is one, comes before Saved on y, a hotkey no other pane Button takes', () => {
    const tabs = Pane.paneTabsOf([Fixtures.sourceAt('a', { name: 'Alpha' })], {
      items: [],
      filter: '',
      expanded: [],
    })

    expect(tabs).toEqual([
      { id: 'a', name: 'Alpha', label: 'Alpha', short: 'Alpha', hotkey: '1' },
      { id: '@stack', name: 'Your stack', label: 'Your stack', short: 'Your stack', hotkey: 'y' },
      { id: 'saved', name: 'Saved', label: 'Saved', short: 'Saved', hotkey: '0' },
    ])

    const others = [...Object.values(Names.PANE_HOTKEYS), ...Object.values(Names.ACTION_HOTKEYS)]

    expect(others.filter(key => key === 'y').length).toBe(1)
    expect(new Set(others).size).toBe(others.length)
  })
})
