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

  test('read items are left out while an unread one remains, the rest mixed by source; all come back once all are read', () => {
    const sources = [Fixtures.sourceAt('a'), Fixtures.sourceAt('b')]
    const items = { a: Fixtures.datedItemsOf('a', 2), b: Fixtures.datedItemsOf('b', 2, 1) }
    const idsOf = (read: Record<string, string[]>) =>
      Band.bandItemsOf(sources, items, [], read).map(item => item.id)

    expect(idsOf({})).toEqual(['a:1', 'b:1', 'a:2', 'b:2'])
    expect(idsOf({ a: ['a:1'], b: ['b:2', 'a:2'] })).toEqual(['a:2', 'b:1'])
    expect(idsOf({ a: ['a:1', 'a:2'], b: ['b:1'] })).toEqual(['b:2'])
    expect(idsOf({ a: ['a:1', 'a:2'], b: ['b:1', 'b:2'] })).toEqual(['a:1', 'b:1', 'a:2', 'b:2'])
  })

  test('a stack item is never read, so it keeps read news items out', () => {
    const [react] = Fixtures.STACK_SAMPLE
    const items = { a: Fixtures.datedItemsOf('a', 1) }

    expect(
      Band.bandItemsOf([Fixtures.sourceAt('a')], items, [react!], { a: ['a:1'] }).map(
        item => item.id,
      ),
    ).toEqual([react?.id])
  })

  test('stack items count as one source and take their turn by date', () => {
    const [react, vite] = Fixtures.STACK_SAMPLE
    const items = { a: Fixtures.datedItemsOf('a', 2, 24 * 4 + 12) }

    expect(
      Band.bandItemsOf([Fixtures.sourceAt('a')], items, [react!, vite!]).map(item => item.id),
    ).toEqual([react?.id, 'a:1', vite?.id, 'a:2'])
    expect(Band.bandItemsOf([], {}, [vite!]).map(item => item.id)).toEqual([vite?.id])
  })

  test('a skewed store: no page of three repeats a source while another has items, the stack one source', () => {
    const { sources, items, stack } = Fixtures.SKEWED_BAND
    const list = Band.bandItemsOf(sources, items, stack)

    expect(list).toHaveLength(27)
    expect(Fixtures.pageRepeatsOf(list.map(item => item.sourceId))).toEqual([])
    expect(list.slice(0, 3).map(item => item.sourceId)).toEqual(['hn', 'sdk', '@stack'])
    expect(list.slice(9).every(item => item.sourceId === 'hn')).toBe(true)
  })

  test('read items are left out first, then the rest are mixed', () => {
    const { sources, items, stack } = Fixtures.SKEWED_BAND
    const read = { hn: ['hn:1', 'hn:3'], sdk: ['sdk:1', 'sdk:2'], willison: ['willison:1'] }
    const list = Band.bandItemsOf(sources, items, stack, read)

    expect(list).toHaveLength(22)
    expect(list.map(item => item.id).filter(id => read.hn.includes(id))).toEqual([])
    expect(Fixtures.pageRepeatsOf(list.map(item => item.sourceId))).toEqual([])
    expect(list.slice(0, 6).map(item => item.id)).toEqual([
      'hn:2',
      stack[0]?.id,
      'anthropic:1',
      'hn:4',
      stack[1]?.id,
      'anthropic:2',
    ])
  })

  test('undated items come after the mixed dated ones, in source order', () => {
    const { sources, items } = Fixtures.SKEWED_BAND
    const undated = (sourceId: string, key: string) => ({
      ...Fixtures.itemAt(key),
      id: `${sourceId}:${key}`,
      sourceId,
    })
    const list = Band.bandItemsOf(sources, {
      ...items,
      hn: [undated('hn', 'x'), ...items.hn],
      willison: [...items.willison, undated('willison', 'y')],
    })

    expect(list.slice(-2).map(item => item.id)).toEqual(['hn:x', 'willison:y'])
    expect(Fixtures.pageRepeatsOf(list.slice(0, -2).map(item => item.sourceId))).toEqual([])
  })

  test('a release feed gives only its newest release by date, older ones left out; other sources keep all', () => {
    const { sources, items, stack } = Fixtures.RELEASE_BAND
    const list = Band.bandItemsOf(sources, items, stack)
    const idsOf = (sourceId: string) =>
      list.filter(item => item.sourceId === sourceId).map(item => item.id)

    expect(list).toHaveLength(15)
    expect(idsOf('code')).toEqual(['code:v2.1.294'])
    expect(idsOf('sdk')).toEqual(['sdk:v0.3.294'])
    expect(idsOf('mcp')).toEqual(['mcp:v1.2.0'])
    expect(idsOf('py')).toEqual(['py:v1.0.1'])
    expect(idsOf('hn')).toEqual(items.hn.map(item => item.id))
    expect(idsOf('willison')).toEqual(['willison:1', 'willison:2'])
    expect(idsOf('@stack')).toEqual([stack[0]?.id])
    expect(list.at(-1)?.id).toBe('py:v1.0.1')
    expect(Fixtures.pageRepeatsOf(list.slice(0, -1).map(item => item.sourceId))).toEqual([])
  })

  test('a read newest release leaves its source out of the band, never falling back to an older release', () => {
    const { sources, items, stack } = Fixtures.RELEASE_BAND
    const read = { code: ['code:v2.1.294'], py: ['py:v1.0.1'], sdk: ['sdk:v0.3.293'] }
    const list = Band.bandItemsOf(sources, items, stack, read)
    const sourceIds = list.map(item => item.sourceId)

    expect(list).toHaveLength(13)
    expect(sourceIds).not.toContain('code')
    expect(sourceIds).not.toContain('py')
    expect(list.filter(item => item.sourceId === 'sdk').map(item => item.id)).toEqual([
      'sdk:v0.3.294',
    ])
  })

  test('a read older release changes nothing; a disabled release feed gives nothing', () => {
    const { sources, items } = Fixtures.RELEASE_BAND
    const ids = (list: readonly { id: string }[]) => list.map(item => item.id)

    expect(ids(Band.bandItemsOf(sources, items, [], { code: ['code:v2.1.293'] }))).toEqual(
      ids(Band.bandItemsOf(sources, items)),
    )
    expect(
      Band.bandItemsOf(
        sources.map(source => (source.id === 'code' ? { ...source, isEnabled: false } : source)),
        items,
      ).some(item => item.sourceId === 'code'),
    ).toBe(false)
  })

  test('a source that is not a release feed keeps every item, even titled as bare versions', () => {
    const { items } = Fixtures.RELEASE_BAND
    const list = Band.bandItemsOf([Fixtures.sourceAt('code', { name: 'Claude Code' })], items)

    expect(list.map(item => item.id)).toEqual([
      'code:v2.1.294',
      'code:v2.1.293',
      'code:v2.1.292',
      'code:v2.1.291',
    ])
  })

  test('only the newest release is left when every item is read', () => {
    const { sources, items } = Fixtures.RELEASE_BAND
    const code = sources.filter(source => source.id === 'code')
    const read = { code: items.code.map(item => item.id) }

    expect(Band.bandItemsOf(code, items, [], read).map(item => item.id)).toEqual(['code:v2.1.294'])
  })
})
