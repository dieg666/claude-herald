import { describe, expect, test } from 'claude-code/testing'

import Items from '../../hooks/items'
import Fixtures from '../fixtures'

describe('merge-items', () => {
  const idsOf = (items: readonly { id: string }[]) => items.map(item => item.id.slice(4))

  test('an item seen again is kept once, as the incoming copy', () => {
    const old = Fixtures.itemAt('a', '2026-01-01T00:00:00Z')
    const fresh = { ...old, title: 'A, edited' }

    const merged = Items.mergeItems([old], [fresh, fresh])

    expect(merged).toEqual([fresh])
  })

  test('an incoming copy without a date keeps the date already known', () => {
    const old = Fixtures.itemAt('a', '2026-01-01T00:00:00Z')
    const { publishedAt, ...undated } = old

    expect(publishedAt).toBeDefined()
    expect(Items.mergeItems([old], [undated])).toEqual([old])
  })

  test('orders dated items newest first, whichever list they came from', () => {
    const merged = Items.mergeItems(
      [Fixtures.itemAt('b', '2026-01-02T00:00:00Z'), Fixtures.itemAt('d', '2026-01-04T00:00:00Z')],
      [Fixtures.itemAt('a', '2026-01-01T00:00:00Z'), Fixtures.itemAt('c', '2026-01-03T00:00:00Z')],
    )

    expect(idsOf(merged)).toEqual(['d', 'c', 'b', 'a'])
  })

  test('puts undated items after dated ones, incoming in feed order then kept ones', () => {
    const merged = Items.mergeItems(
      [Fixtures.itemAt('kept-undated'), Fixtures.itemAt('old', '2025-01-01T00:00:00Z')],
      [
        Fixtures.itemAt('x'),
        Fixtures.itemAt('new', '2026-01-01T00:00:00Z'),
        Fixtures.itemAt('y'),
        { ...Fixtures.itemAt('bad-date'), publishedAt: 'not a date' },
      ],
    )

    expect(idsOf(merged)).toEqual(['new', 'old', 'x', 'y', 'bad-date', 'kept-undated'])
  })

  test('caps at 30 by default, dropping the oldest dated first and undated before them', () => {
    const dated = Array.from({ length: 40 }, (_, index) =>
      Fixtures.itemAt(`d${index}`, new Date(Date.UTC(2026, 0, 1, index)).toISOString()),
    )

    const merged = Items.mergeItems([Fixtures.itemAt('undated')], dated)

    expect(merged.length).toBe(30)
    expect(idsOf(merged)[0]).toBe('d39')
    expect(idsOf(merged)[29]).toBe('d10')
    expect(idsOf(merged)).not.toContain('undated')
  })

  test('a source with no dates keeps the newest 30 in feed order', () => {
    const incoming = Array.from({ length: 35 }, (_, index) => Fixtures.itemAt(`n${index}`))

    expect(idsOf(Items.mergeItems([], incoming))).toEqual(
      incoming.slice(0, 30).map(item => item.id.slice(4)),
    )
  })

  test('takes another cap', () => {
    const incoming = ['a', 'b', 'c'].map(key => Fixtures.itemAt(key))

    expect(idsOf(Items.mergeItems([], incoming, 2))).toEqual(['a', 'b'])
    expect(Items.mergeItems([], incoming, 0)).toEqual([])
  })
})
