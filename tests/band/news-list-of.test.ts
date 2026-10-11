import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'
import Fixtures from '../fixtures'

describe('news-list-of', () => {
  const dated = (sourceId: string, key: string, publishedAt?: string) => ({
    ...Fixtures.itemAt(key, publishedAt),
    id: `${sourceId}:${key}`,
    sourceId,
  })

  test('lists the sources given as they are, disabled or hidden ones included, newest first across them', () => {
    const sources = [
      Fixtures.sourceAt('a', { isEnabled: false }),
      Fixtures.sourceAt('b', { isOnBand: false, isInPane: false }),
    ]
    const items = { a: Fixtures.datedItemsOf('a', 2), b: Fixtures.datedItemsOf('b', 2, 1) }

    expect(Band.newsListOf(sources, items).map(item => item.id)).toEqual([
      'a:1',
      'a:2',
      'b:1',
      'b:2',
    ])
  })

  test('equal dates go by source id, then in stored order; undated items come last, in source order', () => {
    const at = '2026-01-01T10:00:00Z'
    const items = {
      b: [dated('b', 'z', at), dated('b', 'u'), dated('b', 'a', at)],
      a: [dated('a', 'v'), dated('a', 'y', at)],
    }
    const sources = [Fixtures.sourceAt('b'), Fixtures.sourceAt('a')]

    expect(Band.newsListOf(sources, items).map(item => item.id)).toEqual([
      'a:y',
      'b:z',
      'b:a',
      'b:u',
      'a:v',
    ])
  })

  test('at most two flagged stack packages lead, newest first, the rest by date', () => {
    const flagged = (name: string, publishedAt: string) =>
      Fixtures.stackItemAt(name, '2.0.0', {
        current: '1.0.0',
        level: 'major',
        breaking: true,
        publishedAt,
      })
    const stack = [
      flagged('one', '2025-12-01T00:00:00Z'),
      flagged('two', '2025-12-03T00:00:00Z'),
      flagged('three', '2025-12-02T00:00:00Z'),
    ]
    const items = { a: Fixtures.datedItemsOf('a', 1) }
    const list = Band.newsListOf([Fixtures.sourceAt('a')], items, stack)

    expect(list.map(item => item.id)).toEqual([stack[1]?.id, stack[2]?.id, 'a:1', stack[0]?.id])
  })

  test("the flagged packages that lead follow the band's size, one fewer than it shows: none at one, four at five", () => {
    const flagged = (name: string, day: number) =>
      Fixtures.stackItemAt(name, '2.0.0', {
        current: '1.0.0',
        level: 'major',
        security: true,
        publishedAt: `2025-12-0${day}T00:00:00Z`,
      })
    const stack = [1, 2, 3, 4, 5, 6].map(day => flagged(`p${day}`, day))
    const sources = [Fixtures.sourceAt('a')]
    const items = { a: Fixtures.datedItemsOf('a', 2) }
    const names = new Map(stack.map(item => [item.id, item.release.name]))
    const idsAt = (bandSize: number) =>
      Band.newsListOf(sources, items, stack, {}, bandSize).map(
        item => names.get(item.id) ?? item.id,
      )

    expect(idsAt(1)).toEqual(['a:1', 'a:2', 'p6', 'p5', 'p4', 'p3', 'p2', 'p1'])
    expect(idsAt(3)).toEqual(['p6', 'p5', 'a:1', 'a:2', 'p4', 'p3', 'p2', 'p1'])
    expect(idsAt(5)).toEqual(['p6', 'p5', 'p4', 'p3', 'a:1', 'a:2', 'p2', 'p1'])
    expect(Band.newsListOf(sources, items, stack).map(item => item.id)).toEqual(
      Band.newsListOf(sources, items, stack, {}, 3).map(item => item.id),
    )
  })
})
