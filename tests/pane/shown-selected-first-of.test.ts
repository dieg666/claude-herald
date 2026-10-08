import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('shown-selected-first-of', () => {
  const SOURCES = [Fixtures.sourceAt('a')]
  const ITEMS = { a: Fixtures.datedItemsOf('a', 5) }
  const SAVED = [
    { ...Fixtures.itemAt('one'), savedAt: 1 },
    { ...Fixtures.itemAt('two'), savedAt: 2 },
  ]

  const idsOf = (tab: string, selected: number, size: number) =>
    Pane.shownSelectedFirstOf(Pane.panePageOf({ tab, selected }, SOURCES, ITEMS, SAVED, size)).map(
      item => item.id,
    )

  test('the selected item first, then the rest of the window in order', () => {
    expect(idsOf('a', 0, 3)).toEqual(['a:1', 'a:2', 'a:3'])
    expect(idsOf('a', 2, 3)).toEqual(['a:3', 'a:2', 'a:4'])
    expect(idsOf('a', 4, 3)).toEqual(['a:5', 'a:3', 'a:4'])
    expect(idsOf('saved', 1, 3)).toEqual(['src:two', 'src:one'])
  })

  test('an empty tab gives nothing; the stack tab keeps its order', () => {
    expect(
      Pane.shownSelectedFirstOf(Pane.panePageOf({ tab: 'a', selected: 0 }, SOURCES, {}, [], 3)),
    ).toEqual([])

    const stack = { items: Fixtures.STACK_SAMPLE, filter: '', expanded: [] }
    const page = Pane.panePageOf({ tab: '@stack', selected: 3 }, SOURCES, ITEMS, SAVED, 20, stack)

    expect(Pane.shownSelectedFirstOf(page)).toEqual(page.shown)
  })
})
