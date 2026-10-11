import { describe, expect, test } from 'claude-code/testing'

import type { Item } from '../../types/index.js'
import Band from '../../hooks/band'
import Stack from '../../hooks/deps/stack'
import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('all-tab-items-of', () => {
  const { sources, items, stack } = Fixtures.FLAGGED_BAND
  const idsOf = (list: readonly { readonly id: string }[]) => list.map(item => item.id)
  // A stack release by its package, a news item by its id.
  const namesOf = (list: readonly Item[]) =>
    list.map(item => (Stack.isStackItem(item) ? item.release.name : item.id))

  test("the band's list in the band's order: flagged stack releases lead, then newest first across sources, a release feed by its newest only, undated last", () => {
    const all = Pane.allTabItemsOf(sources, items, stack)

    expect(idsOf(all)).toEqual(idsOf(Band.bandItemsOf(sources, items, stack)))
    expect(namesOf(all.slice(0, 2))).toEqual(['requests', 'jsdom'])
    expect(namesOf(all.slice(2, 6))).toEqual(['vite', 'hn:1', 'hn:2', 'sdk:1'])

    const release = Fixtures.RELEASE_BAND
    const releases = Pane.allTabItemsOf(release.sources, release.items, release.stack)

    expect(idsOf(releases.filter(item => item.sourceId === 'code'))).toEqual(['code:v2.1.294'])
    expect(idsOf(releases.slice(-1))).toEqual(['py:v1.0.1'])
  })

  test('read items stay in place instead of being left out: the list the band shows once every news item is read and there is no stack', () => {
    const everything = Band.bandItemsOf(sources, items, stack)
    const read = { hn: idsOf(items.hn.slice(0, 5)), sdk: ['sdk:1'] }
    const allRead = Object.fromEntries(Object.entries(items).map(([id, list]) => [id, idsOf(list)]))

    expect(idsOf(Pane.allTabItemsOf(sources, items, stack))).toEqual(idsOf(everything))
    expect(Band.bandItemsOf(sources, items, stack, read).length).toBe(everything.length - 6)
    expect(idsOf(Band.bandItemsOf(sources, items, [], allRead))).toEqual(
      idsOf(Pane.allTabItemsOf(sources, items)),
    )
  })

  test('a turned-off source is left out, and no stack leaves only the news', () => {
    const off = sources.map(source =>
      source.id === 'hn' ? { ...source, isEnabled: false } : source,
    )

    expect(Pane.allTabItemsOf(off, items, stack).some(item => item.sourceId === 'hn')).toBe(false)
    expect(Pane.allTabItemsOf(sources, items).some(item => item.sourceId === '@stack')).toBe(false)
    expect(Pane.allTabItemsOf([], items)).toEqual([])
  })

  test('a source hidden from the pane is left out while it stays on the band, and one hidden from the band stays here', () => {
    const flagged = sources.map(source =>
      source.id === 'hn'
        ? { ...source, isInPane: false }
        : source.id === 'sdk'
          ? { ...source, isOnBand: false }
          : source,
    )
    const sourceIdsOf = (list: readonly Item[]) => [...new Set(list.map(item => item.sourceId))]

    expect(sourceIdsOf(Pane.allTabItemsOf(flagged, items)).sort()).toEqual([
      'anthropic',
      'sdk',
      'willison',
    ])
    expect(sourceIdsOf(Band.bandItemsOf(flagged, items)).sort()).toEqual([
      'anthropic',
      'hn',
      'willison',
    ])
    expect(Pane.allTabItemsOf(flagged, items, stack).filter(Stack.isStackItem)).toHaveLength(4)
  })

  test("a package's releases are one row, its target, as in the band", () => {
    const all = Pane.allTabItemsOf(sources, items, Fixtures.STACK_MIDDLE)
    const stackRows = all.filter(Stack.isStackItem)

    expect(all).toEqual(Band.bandItemsOf(sources, items, Fixtures.STACK_MIDDLE))
    expect(stackRows.map(item => [item.release.name, item.release.version])).toEqual([
      ['zod', '4.6.5'],
      ['vite', '5.2.0'],
      ['ky', '1.0.0'],
    ])
  })
})
