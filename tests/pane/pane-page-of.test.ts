import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('pane-page-of', () => {
  const SOURCES = [
    Fixtures.sourceAt('a'),
    Fixtures.sourceAt('off', { isEnabled: false }),
    Fixtures.sourceAt('b'),
  ]
  const ITEMS = {
    a: Fixtures.datedItemsOf('a', 5),
    off: Fixtures.datedItemsOf('off', 2),
    b: Fixtures.datedItemsOf('b', 2),
  }
  const SAVED = [{ ...Fixtures.itemAt('kept'), savedAt: 1 }]

  const pageOf = (tab: string, selected: number, size = 10) =>
    Pane.panePageOf({ tab, selected }, SOURCES, ITEMS, SAVED, size)

  test('the tab named, its items, the selection inside them', () => {
    const page = pageOf('b', 1)

    expect([page.tab.id, page.items.map(item => item.id), page.selected]).toEqual([
      'b',
      ['b:1', 'b:2'],
      1,
    ])
    expect(page.tabs.map(tab => tab.id)).toEqual(['a', 'b', 'saved'])
    expect(page.shown).toEqual(page.items)
  })

  test('no tab, a disabled source and a removed one show the first tab from the top', () => {
    for (const tab of ['', 'off', 'gone']) {
      const page = pageOf(tab, 3)

      expect([page.tab.id, page.selected]).toEqual(['a', 0])
    }
  })

  test('with every source off the saved tab is the first', () => {
    const page = Pane.panePageOf({ tab: 'a', selected: 0 }, [], ITEMS, SAVED, 10)

    expect([page.tab.id, page.items]).toEqual(['saved', SAVED])
  })

  test('a selection past the end, negative or not a whole number comes back inside', () => {
    expect(pageOf('a', 99).selected).toBe(4)
    expect(pageOf('a', -1).selected).toBe(0)
    expect(pageOf('a', 1.5).selected).toBe(0)
    expect(pageOf('saved', 3).selected).toBe(0)
  })

  test('an empty tab selects nothing past 0 and shows nothing', () => {
    const page = Pane.panePageOf({ tab: 'a', selected: 2 }, SOURCES, {}, [], 10)

    expect([page.items, page.shown, page.selected]).toEqual([[], [], 0])
  })

  test('a window of size around the selection', () => {
    const page = pageOf('a', 4, 2)

    expect([page.span, page.shown.map(item => item.id), page.size]).toEqual([
      { start: 3, count: 2, selected: 1 },
      ['a:4', 'a:5'],
      2,
    ])
  })

  test('a size that is not a number gives the first window, never NaN', () => {
    expect(pageOf('a', 0, Number.NaN).size).toBe(Pane.PANE_FIRST_WINDOW)
  })

  const STACK = { items: Fixtures.STACK_SAMPLE, filter: '' }

  test('the stack tab lists the shown stack items grouped by ecosystem, filtered; without a stack there is no such tab', () => {
    const page = Pane.panePageOf({ tab: '@stack', selected: 0 }, SOURCES, ITEMS, SAVED, 20, STACK)

    expect(page.tabs.map(tab => tab.id)).toEqual(['a', 'b', '@stack', 'saved'])
    expect(page.items.map(item => item.title)).toEqual([
      'React 19',
      'v5.1.0',
      'v4.17.21',
      'v16.0.0-rc.1',
      'v0.4.0',
      'v2.31.1',
    ])

    const filtered = Pane.panePageOf({ tab: '@stack', selected: 3 }, SOURCES, ITEMS, SAVED, 20, {
      ...STACK,
      filter: 'security',
    })

    expect([filtered.items.map(item => item.title), filtered.selected]).toEqual([['v2.31.1'], 0])
    expect(pageOf('@stack', 0).tab.id).toBe('a')
  })

  test("the stack tab's window leaves room for the filter and one heading per ecosystem", () => {
    const page = Pane.panePageOf({ tab: '@stack', selected: 0 }, SOURCES, ITEMS, SAVED, 4, STACK)

    // Two ecosystems and the filter take three lines, two rows' worth.
    expect([page.shown.length, page.size]).toEqual([2, 4])
  })
})
