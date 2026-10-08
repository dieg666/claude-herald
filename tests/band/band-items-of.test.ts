import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'
import Fixtures from '../fixtures'

describe('band-items-of', () => {
  test("every enabled source's items, newest first across sources", () => {
    const sources = [
      Fixtures.sourceAt('a'),
      Fixtures.sourceAt('off', { isEnabled: false }),
      Fixtures.sourceAt('b'),
    ]
    const items = {
      a: Fixtures.datedItemsOf('a', 2, 1),
      off: Fixtures.datedItemsOf('off', 2),
      b: [...Fixtures.datedItemsOf('b', 1), ...Fixtures.datedItemsOf('b', 2, 5).slice(1)],
    }

    expect(Band.bandItemsOf(sources, items).map(item => item.id)).toEqual([
      'b:1',
      'a:1',
      'a:2',
      'b:2',
    ])
  })

  test('undated or unparsable items come after the dated ones, in source order', () => {
    const sources = [Fixtures.sourceAt('a'), Fixtures.sourceAt('b')]
    const [dated] = Fixtures.datedItemsOf('b', 1)
    const items = {
      a: [Fixtures.itemAt('x'), { ...Fixtures.itemAt('y'), publishedAt: 'someday' }],
      b: [Fixtures.itemAt('z'), ...(dated === undefined ? [] : [dated])],
    }

    expect(Band.bandItemsOf(sources, items).map(item => item.title)).toEqual(['b 1', 'x', 'y', 'z'])
  })

  test('a source with no items, or none at all, gives nothing', () => {
    expect(Band.bandItemsOf([Fixtures.sourceAt('a')], {})).toEqual([])
    expect(Band.bandItemsOf([], { a: [Fixtures.itemAt('x')] })).toEqual([])
    expect(Band.bandItemsOf([Fixtures.sourceAt('toString')], {})).toEqual([])
  })

  test('stack items join the list by date, after news items of the same time', () => {
    const [react, vite] = Fixtures.STACK_SAMPLE
    const items = { a: Fixtures.datedItemsOf('a', 2, 24 * 4 + 12) }

    expect(
      Band.bandItemsOf([Fixtures.sourceAt('a')], items, [react!, vite!]).map(item => item.id),
    ).toEqual([react?.id, vite?.id, 'a:1', 'a:2'])
    expect(Band.bandItemsOf([], {}, [vite!]).map(item => item.id)).toEqual([vite?.id])
  })
})
