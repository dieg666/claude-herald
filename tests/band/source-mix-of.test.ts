import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'
import type { Item } from '../../types/index.js'
import Fixtures from '../fixtures'

describe('source-mix-of', () => {
  const { items, stack } = Fixtures.SKEWED_BAND
  const skewed: Item[] = [
    ...items.hn,
    ...items.anthropic,
    ...items.sdk,
    ...items.willison,
    ...stack,
  ]
  const sourcesOf = (list: readonly Item[]) => list.map(item => item.sourceId)

  test('a skewed list: no page of three repeats a source while another has items, the newest first', () => {
    const mixed = Band.sourceMixOf(skewed)

    expect(Fixtures.pageRepeatsOf(sourcesOf(mixed))).toEqual([])
    expect(mixed.slice(0, 9).map(item => item.id)).toEqual([
      'hn:1',
      'sdk:1',
      stack[0]?.id,
      'anthropic:1',
      'willison:1',
      'hn:2',
      'sdk:2',
      'anthropic:2',
      stack[1]?.id,
    ])
  })

  test('the busy source gets one place a round, and its tail fills the later pages newest first', () => {
    const mixed = Band.sourceMixOf(skewed)

    expect(new Set(sourcesOf(mixed.slice(0, 5))).size).toBe(5)
    expect(sourcesOf(mixed.slice(0, 9)).filter(id => id === 'hn')).toHaveLength(2)
    expect(mixed.slice(9).map(item => item.id)).toEqual(items.hn.slice(2).map(item => item.id))
    expect([...mixed].sort((a, b) => a.id.localeCompare(b.id))).toEqual(
      [...skewed].sort((a, b) => a.id.localeCompare(b.id)),
    )
  })

  test('the same items in any order give the same list', () => {
    const reversed = [...skewed].reverse()
    const bySource = [...stack, ...items.willison, ...items.sdk, ...items.anthropic, ...items.hn]

    expect(Band.sourceMixOf(reversed)).toEqual(Band.sourceMixOf(skewed))
    expect(Band.sourceMixOf(bySource)).toEqual(Band.sourceMixOf(skewed))
  })

  test('ties across sources go by source id, then item id; ties within a source keep the order given', () => {
    const at = '2026-01-01T00:00:00Z'
    const of = (sourceId: string, key: string) => ({
      ...Fixtures.itemAt(key, at),
      id: `${sourceId}:${key}`,
      sourceId,
    })

    expect(
      Band.sourceMixOf([of('b', 'x'), of('a', 'z'), of('a', 'y'), of('c', 'w')]).map(
        item => item.id,
      ),
    ).toEqual(['a:z', 'b:x', 'c:w', 'a:y'])
  })

  test('two sources alternate as far as they can; one source keeps its own order', () => {
    const two = [...Fixtures.datedItemsOf('a', 4), ...Fixtures.datedItemsOf('b', 1, 10)]

    expect(Band.sourceMixOf(two).map(item => item.id)).toEqual(['a:1', 'b:1', 'a:2', 'a:3', 'a:4'])
    expect(Band.sourceMixOf(Fixtures.datedItemsOf('a', 3)).map(item => item.id)).toEqual([
      'a:1',
      'a:2',
      'a:3',
    ])
    expect(Band.sourceMixOf([])).toEqual([])
  })

  test('a source that ends one round waits instead of opening the next on the same page', () => {
    // Each source's items at these hours before 2026-01-02; d's second item is the newest second one.
    const hours = { a: [0, 5], b: [1, 6], c: [2, 7], d: [3, 4] }
    const list = Object.entries(hours).flatMap(([sourceId, [first = 0, second = 0]]) => [
      ...Fixtures.datedItemsOf(sourceId, 1, first),
      { ...Fixtures.datedItemsOf(sourceId, 1, second)[0]!, id: `${sourceId}:2` },
    ])
    const mixed = Band.sourceMixOf(list).map(item => item.id)

    expect(mixed).toEqual(['a:1', 'b:1', 'c:1', 'd:1', 'a:2', 'b:2', 'd:2', 'c:2'])
    expect(Fixtures.pageRepeatsOf(mixed.map(id => id.slice(0, 1)))).toEqual([])
  })

  test('a page never repeats a source while others have items, for many sources of uneven sizes', () => {
    const uneven = Array.from({ length: 7 }, (_, source) =>
      Fixtures.datedItemsOf(`s${source}`, 1 + ((source * 5) % 9), source * 3),
    ).flat()
    const mixed = Band.sourceMixOf(uneven)

    expect(Fixtures.pageRepeatsOf(sourcesOf(mixed))).toEqual([])
    expect(Fixtures.pageRepeatsOf(sourcesOf(mixed.slice(1)))).toEqual([])
    expect(mixed).toHaveLength(uneven.length)
  })
})
