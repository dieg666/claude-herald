import { describe, expect, test } from 'claude-code/testing'

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

  test('names become one line cut to a tab width; a blank name shows the id', () => {
    const [long, blank] = Pane.paneTabsOf([
      Fixtures.sourceAt('long', { name: `Very\nlong ${'x'.repeat(40)}` }),
      Fixtures.sourceAt('blank', { name: ' \u0007 ' }),
    ])

    expect(long?.label).toBe(`Very long ${'x'.repeat(13)}…`)
    expect(blank?.label).toBe('blank')
  })
})
