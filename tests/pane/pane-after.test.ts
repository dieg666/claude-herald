import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('pane-after', () => {
  const SOURCES = [Fixtures.sourceAt('a'), Fixtures.sourceAt('b')]
  const ITEMS = { a: Fixtures.datedItemsOf('a', 3), b: Fixtures.datedItemsOf('b', 2) }

  const pageOf = (tab: string, selected: number) =>
    Pane.panePageOf({ tab, selected }, SOURCES, ITEMS, [], 10)

  test('another tab starts at its top; the active one keeps its selection', () => {
    expect(Pane.paneAfter(pageOf('a', 2), { tab: 'b' })).toEqual({ tab: 'b', selected: 0 })
    expect(Pane.paneAfter(pageOf('a', 2), { tab: 'a' })).toEqual({ tab: 'a', selected: 2 })
  })

  test('up and down move one item and stop at the ends', () => {
    expect(Pane.paneAfter(pageOf('a', 1), 'down')).toEqual({ tab: 'a', selected: 2 })
    expect(Pane.paneAfter(pageOf('a', 2), 'down')).toEqual({ tab: 'a', selected: 2 })
    expect(Pane.paneAfter(pageOf('a', 1), 'up')).toEqual({ tab: 'a', selected: 0 })
    expect(Pane.paneAfter(pageOf('a', 0), 'up')).toEqual({ tab: 'a', selected: 0 })
  })

  test('a move from no tab writes the tab it fell back to', () => {
    expect(Pane.paneAfter(pageOf('', 0), 'down')).toEqual({ tab: 'a', selected: 1 })
  })

  test('an empty tab stays at 0', () => {
    const page = Pane.panePageOf({ tab: 'a', selected: 0 }, SOURCES, {}, [], 10)

    expect(Pane.paneAfter(page, 'down')).toEqual({ tab: 'a', selected: 0 })
  })
})
