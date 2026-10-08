import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('pane-new-counts-of', () => {
  const ITEMS = { a: Fixtures.datedItemsOf('a', 3), b: Fixtures.datedItemsOf('b', 2) }

  test('the kept items of each source not among its viewed ids; none when all were viewed', () => {
    expect(Pane.paneNewCountsOf(ITEMS, { a: ['a:3'], b: ['b:1', 'b:2', 'b:9'] })).toEqual({ a: 2 })
  })

  test('a source with no viewed ids yet counts none, and one with an empty list counts all', () => {
    expect(Pane.paneNewCountsOf(ITEMS, {})).toEqual({})
    expect(Pane.paneNewCountsOf(ITEMS, { b: [] })).toEqual({ b: 2 })
  })
})
