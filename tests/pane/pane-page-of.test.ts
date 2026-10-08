import { describe, expect, test } from 'claude-code/testing'

import type { StackItem } from '../../types/index.js'
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

  const STACK = { items: Fixtures.STACK_SAMPLE, filter: '', expanded: [] }

  test('the stack tab lists a package per row grouped by ecosystem, flagged then by level, filtered; without a stack there is no such tab', () => {
    const page = Pane.panePageOf({ tab: '@stack', selected: 0 }, SOURCES, ITEMS, SAVED, 20, STACK)

    expect(page.tabs.map(tab => tab.id)).toEqual(['a', 'b', '@stack', 'saved'])
    expect(page.items.map(item => item.title)).toEqual([
      'React 19',
      'v16.0.0-rc.1',
      'v0.4.0',
      'v5.1.0',
      'v4.17.21',
      'v2.31.1',
    ])
    expect(page.stack?.rows.map(row => row.kind)).toEqual(Array(6).fill('package'))
    expect(page.stack?.summary).toBe('6 packages behind · 1 security · 1 breaking')

    const filtered = Pane.panePageOf({ tab: '@stack', selected: 3 }, SOURCES, ITEMS, SAVED, 20, {
      ...STACK,
      filter: 'security',
    })

    expect([filtered.items.map(item => item.title), filtered.selected]).toEqual([['v2.31.1'], 0])
    expect(pageOf('@stack', 0).tab.id).toBe('a')
  })

  test("the stack tab's window counts lines, one per row, less the summary, the filter and one heading per ecosystem", () => {
    const page = Pane.panePageOf({ tab: '@stack', selected: 0 }, SOURCES, ITEMS, SAVED, 4, STACK)

    // Four one-line items and the three summary lines are seven lines; the summary, the filter and two headings leave three rows.
    expect([page.span.count, page.stack?.shownRows.length, page.size]).toEqual([3, 3, 4])
  })

  test('a news tab of the same size shows that many one-line items', () => {
    expect(pageOf('a', 0, 4).span.count).toBe(4)
  })

  test("a failing source's state line takes one row from its window, the size kept as given; an empty tab and a clean one lose none", () => {
    const failing = { errors: { a: 'timed out' } }
    const page = Pane.panePageOf(
      { tab: 'a', selected: 4 },
      SOURCES,
      ITEMS,
      SAVED,
      4,
      undefined,
      {},
      failing,
    )

    expect([page.stateLine, page.span, page.shown.map(item => item.id), page.size]).toEqual([
      { text: "Couldn't refresh: timed out" },
      { start: 2, count: 3, selected: 2 },
      ['a:3', 'a:4', 'a:5'],
      4,
    ])
    expect(
      Pane.panePageOf({ tab: 'b', selected: 0 }, SOURCES, ITEMS, SAVED, 4, undefined, {}, failing)
        .span.count,
    ).toBe(2)
    expect(
      Pane.panePageOf({ tab: 'a', selected: 0 }, SOURCES, ITEMS, SAVED, 1, undefined, {}, failing)
        .span.count,
    ).toBe(1)
    expect(
      Pane.panePageOf({ tab: 'a', selected: 0 }, SOURCES, {}, SAVED, 4, undefined, {}, failing)
        .stateLine,
    ).toEqual({ text: "Couldn't refresh: timed out" })
    expect(pageOf('a', 0, 4).stateLine).toBeUndefined()
  })

  test('an empty tab carries why it is empty; the saved tab and the stack tab too', () => {
    expect(Pane.panePageOf({ tab: 'saved', selected: 0 }, SOURCES, ITEMS, [], 4).stateLine).toEqual(
      { text: 'Nothing saved yet. Press v on an item to keep it here.' },
    )
    expect(
      Pane.panePageOf({ tab: '@stack', selected: 0 }, SOURCES, ITEMS, SAVED, 4, {
        ...STACK,
        filter: 'nothing like it',
      }).stateLine,
    ).toEqual({ text: 'No package matches "nothing like it". Clear the filter to see all.' })
    expect(
      Pane.panePageOf({ tab: '@stack', selected: 0 }, SOURCES, ITEMS, SAVED, 4, STACK).stateLine,
    ).toBeUndefined()
  })

  test('an expanded package lists its releases as rows acting on each; the window hands over every release of the packages in it', () => {
    const stack = { items: Fixtures.STACK_RELEASES, filter: '', expanded: ['npm:jsdom'] }
    const page = Pane.panePageOf({ tab: '@stack', selected: 2 }, SOURCES, ITEMS, SAVED, 20, stack)
    const versions = page.items.map(item => (item as StackItem).release.version)

    expect(versions.slice(0, 5)).toEqual(['11.1.7', '30.1.2', '30.1.2', '30.1.1', '30.0.0'])
    expect(page.stack?.rows.slice(1, 5).map(row => row.kind)).toEqual([
      'package',
      'release',
      'release',
      'release',
    ])
    expect(page.selected).toBe(2)

    const one = Pane.panePageOf({ tab: '@stack', selected: 1 }, SOURCES, ITEMS, SAVED, 3, {
      ...stack,
      expanded: [],
    })

    // Three items and three summary lines are six lines; less the summary, the filter and two headings, two rows: @astrojs/node and jsdom.
    expect(one.shown.map(item => (item as StackItem).release.version)).toEqual([
      '11.1.7',
      '30.1.2',
      '30.1.1',
      '30.0.0',
    ])
  })
})
