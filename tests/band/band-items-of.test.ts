import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'
import Stack from '../../hooks/deps/stack'
import Fixtures from '../fixtures'

describe('band-items-of', () => {
  const isNewestFirst = (list: readonly { publishedAt?: string }[]) => {
    const times = list.map(item => Date.parse(item.publishedAt ?? ''))

    return times.every((time, index) => index === 0 || time <= (times[index - 1] ?? time))
  }

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

  test('read items are left out while an unread one remains, the rest newest first; all come back once all are read', () => {
    const sources = [Fixtures.sourceAt('a'), Fixtures.sourceAt('b')]
    const items = { a: Fixtures.datedItemsOf('a', 2), b: Fixtures.datedItemsOf('b', 2, 1) }
    const idsOf = (read: Record<string, string[]>) =>
      Band.bandItemsOf(sources, items, [], read).map(item => item.id)

    expect(idsOf({})).toEqual(['a:1', 'a:2', 'b:1', 'b:2'])
    expect(idsOf({ a: ['a:1'], b: ['b:2', 'a:2'] })).toEqual(['a:2', 'b:1'])
    expect(idsOf({ a: ['a:1', 'a:2'], b: ['b:1'] })).toEqual(['b:2'])
    expect(idsOf({ a: ['a:1', 'a:2'], b: ['b:1', 'b:2'] })).toEqual(['a:1', 'a:2', 'b:1', 'b:2'])
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

  test("a breaking stack release leads, and the stack's other releases go by date among the news", () => {
    const [react, vite] = Fixtures.STACK_SAMPLE
    const items = { a: Fixtures.datedItemsOf('a', 2, 24 * 4 + 12) }

    expect(
      Band.bandItemsOf([Fixtures.sourceAt('a')], items, [react!, vite!]).map(item => item.id),
    ).toEqual([react?.id, vite?.id, 'a:1', 'a:2'])
    expect(Band.bandItemsOf([], {}, [vite!]).map(item => item.id)).toEqual([vite?.id])
  })

  test('a skewed store: newest first across sources and the stack, a busy source filling the pages its items fall on', () => {
    const { sources, items, stack } = Fixtures.SKEWED_BAND
    const list = Band.bandItemsOf(sources, items, stack)

    expect(list).toHaveLength(27)
    expect(isNewestFirst(list)).toBe(true)
    expect(list.slice(0, 9).map(item => item.id)).toEqual([
      'hn:1',
      'hn:2',
      'sdk:1',
      'hn:3',
      'sdk:2',
      stack[0]?.id,
      'hn:4',
      'anthropic:1',
      'hn:5',
    ])
    expect(list.slice(11, 18).every(item => item.sourceId === 'hn')).toBe(true)
  })

  test('equal dates go by source id, then in stored order, whatever the order of the sources', () => {
    const at = '2026-01-01T10:00:00Z'
    const dated = (sourceId: string, key: string) => ({
      ...Fixtures.itemAt(key, at),
      id: `${sourceId}:${key}`,
      sourceId,
    })
    const items = {
      b: [dated('b', 'z'), dated('b', 'a')],
      a: [dated('a', 'y'), dated('a', 'x')],
      c: [{ ...dated('c', 'w'), publishedAt: '2026-01-01T11:00:00Z' }],
    }
    const ids = (order: readonly string[]) =>
      Band.bandItemsOf(
        order.map(id => Fixtures.sourceAt(id)),
        items,
      ).map(item => item.id)

    expect(ids(['b', 'a', 'c'])).toEqual(['c:w', 'a:y', 'a:x', 'b:z', 'b:a'])
    expect(ids(['c', 'a', 'b'])).toEqual(ids(['b', 'a', 'c']))
  })

  test('a source hidden from the band leaves it, kept on the pane; a disabled one shows nowhere whatever its flags; one stored without the flags shows', () => {
    const items = {
      a: Fixtures.datedItemsOf('a', 2),
      b: Fixtures.datedItemsOf('b', 2, 1),
      c: Fixtures.datedItemsOf('c', 1, 2),
    }
    const sourceIdsOf = (sources: Parameters<typeof Band.bandItemsOf>[0]) => [
      ...new Set(Band.bandItemsOf(sources, items).map(item => item.sourceId)),
    ]

    expect(
      sourceIdsOf([
        Fixtures.sourceAt('a', { isOnBand: false }),
        Fixtures.sourceAt('b', { isInPane: false }),
        Fixtures.sourceAt('c', { isEnabled: false, isOnBand: true }),
      ]),
    ).toEqual(['b'])
    expect(
      sourceIdsOf([
        Fixtures.sourceAt('a', { isOnBand: true }),
        Fixtures.sourceAt('b'),
        Fixtures.sourceAt('c'),
      ]),
    ).toEqual(['a', 'b', 'c'])
  })

  test('read items are left out first, then the rest go newest first', () => {
    const { sources, items, stack } = Fixtures.SKEWED_BAND
    const read = { hn: ['hn:1', 'hn:3'], sdk: ['sdk:1', 'sdk:2'], willison: ['willison:1'] }
    const list = Band.bandItemsOf(sources, items, stack, read)

    expect(list).toHaveLength(22)
    expect(list.map(item => item.id).filter(id => read.hn.includes(id))).toEqual([])
    expect(isNewestFirst(list)).toBe(true)
    expect(list.slice(0, 6).map(item => item.id)).toEqual([
      'hn:2',
      stack[0]?.id,
      'hn:4',
      'anthropic:1',
      'hn:5',
      'anthropic:2',
    ])
  })

  test('breaking and security stack releases lead, newest first, however old; the rest go newest first after them', () => {
    const { sources, items, stack } = Fixtures.FLAGGED_BAND
    const [vite, , requests, jsdom] = stack
    const list = Band.bandItemsOf(sources, items, stack)

    expect(list).toHaveLength(29)
    expect(list.slice(0, 6).map(item => item.id)).toEqual([
      requests?.id,
      jsdom?.id,
      vite?.id,
      'hn:1',
      'hn:2',
      'sdk:1',
    ])
    expect(isNewestFirst(list.slice(2))).toBe(true)
    expect(Band.bandItemsOf(sources, items, [...stack].reverse())).toEqual(list)
  })

  test('the rows that lead are drawn with ⚠, and an undated flagged release comes after a dated one', () => {
    const { sources, items, stack } = Fixtures.FLAGGED_BAND
    const [vite, react, requests] = stack
    const undated = Fixtures.stackItemAt('undici', '7.0.0', { current: '6.0.0', breaking: true })
    const list = Band.bandItemsOf(sources, items, [undated, vite!, react!, requests!])

    expect(list.slice(0, 2).map(item => item.id)).toEqual([requests?.id, undated.id])
    expect(
      list.map(item => Stack.isStackItem(item) && Stack.stackIconOf(item.release) === '⚠'),
    ).toEqual(list.map((_, index) => index < 2))
  })

  test('at most two flagged releases lead; the others go by date', () => {
    const { sources, items, stack } = Fixtures.FLAGGED_BAND
    const lodash = Fixtures.stackItemAt('lodash', '5.0.0', {
      current: '4.17.21',
      level: 'major',
      security: true,
      publishedAt: '2026-01-01T10:00:00Z',
    })
    const undici = Fixtures.stackItemAt('undici', '7.0.0', {
      current: '6.0.0',
      level: 'major',
      breaking: true,
      publishedAt: '2025-12-25T00:00:00Z',
    })
    const [vite, react, requests, jsdom] = stack
    const all = [vite!, lodash, react!, requests!, undici, jsdom!]
    const list = Band.bandItemsOf(sources, items, all)
    const ids = list.map(item => item.id)
    const stackIds = list.filter(item => item.sourceId === '@stack').map(item => item.id)

    expect(list).toHaveLength(31)
    expect(ids.slice(0, 4)).toEqual([lodash.id, requests?.id, vite?.id, 'hn:1'])
    expect(stackIds).toEqual([lodash.id, requests?.id, vite?.id, react?.id, undici.id, jsdom?.id])
    expect(ids.slice(-2)).toEqual([undici.id, jsdom?.id])
    expect(isNewestFirst(list.slice(2))).toBe(true)
    expect(Band.bandItemsOf(sources, items, [...all].reverse())).toEqual(list)
  })

  test('a read breaking or security release is still left out, and the rest lead', () => {
    const { sources, items, stack } = Fixtures.FLAGGED_BAND
    const [vite, , requests, jsdom] = stack
    const read = { '@stack': [requests?.id ?? ''], hn: ['hn:1'] }
    const list = Band.bandItemsOf(sources, items, stack, read)

    expect(list).toHaveLength(27)
    expect(list.slice(0, 4).map(item => item.id)).toEqual([jsdom?.id, vite?.id, 'hn:2', 'sdk:1'])
    expect(list.map(item => item.id)).not.toContain(requests?.id)
    expect(isNewestFirst(list.slice(1))).toBe(true)
  })

  test('once every item is read, all come back with the breaking and security releases leading', () => {
    const { sources, items, stack } = Fixtures.FLAGGED_BAND
    const read = Object.fromEntries(
      [...Object.values(items), stack].map(list => [
        list[0]?.sourceId ?? '',
        list.map(item => item.id),
      ]),
    )

    const list = Band.bandItemsOf(sources, items, stack, read)

    expect(list).toEqual(Band.bandItemsOf(sources, items, stack))
    expect(list.slice(0, 4).map(item => item.id)).toEqual([
      stack[2]?.id,
      stack[3]?.id,
      stack[0]?.id,
      'hn:1',
    ])
  })

  test('undated items come after the dated ones, in source order', () => {
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
    expect(isNewestFirst(list.slice(0, -2))).toBe(true)
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
    expect(isNewestFirst(list.slice(0, -1))).toBe(true)
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

  test("a package's releases make one item, its target, and a flagged one among them makes the package lead", () => {
    const { sources, items } = Fixtures.FLAGGED_BAND
    const list = Band.bandItemsOf(sources, items, Fixtures.STACK_MIDDLE)
    const stackItems = list.filter(Stack.isStackItem)
    const [lead] = list

    expect(
      stackItems.map(item => [item.release.name, item.release.current, item.release.version]),
    ).toEqual([
      ['zod', '3.23.8', '4.6.5'],
      ['vite', '5.0.0', '5.2.0'],
      ['ky', '0.9.0', '1.0.0'],
    ])
    expect(Stack.isStackItem(lead!) && lead.release.version).toBe('4.6.5')
    expect(Stack.isStackItem(lead!) && Stack.stackItemIconOf(lead)).toBe('⚠')
    expect(list.map(item => item.id)).not.toContain(Fixtures.STACK_MIDDLE[3]?.id)
    expect(Band.bandItemsOf(sources, items, [...Fixtures.STACK_MIDDLE].reverse())).toEqual(list)
  })

  test('only the newest two flagged packages lead, however many releases each has', () => {
    const { sources, items } = Fixtures.FLAGGED_BAND
    const [, , requests, jsdom] = Fixtures.FLAGGED_BAND.stack
    const older = Fixtures.stackItemAt('jsdom', '30.1.0', { current: '25.0.1', level: 'major' })
    const list = Band.bandItemsOf(sources, items, [
      ...Fixtures.STACK_MIDDLE,
      requests!,
      jsdom!,
      older,
    ])

    expect(list.filter(Stack.isStackItem).length).toBe(5)
    expect(
      list
        .slice(0, 2)
        .map(item => Stack.isStackItem(item) && [item.release.name, item.release.version]),
    ).toEqual([
      ['zod', '4.6.5'],
      ['requests', '2.31.1'],
    ])
  })
})
