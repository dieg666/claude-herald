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

  describe('one story under two ids', () => {
    const URL = 'https://example.com/story'

    // An entry the source gave its own identifier.
    const guided = (id: string, fields: Record<string, unknown> = {}) => ({
      ...Fixtures.itemAt('story', '2026-01-01T00:00:00Z'),
      id: `src:${id}`,
      ...fields,
    })

    // An entry with no guid, so its id came from its link.
    const linked = (fields: Record<string, unknown> = {}) =>
      guided(URL, { url: URL, text: 'Comments', ...fields })

    test('an incoming link copy merges into the stored item with a guid and keeps its id', () => {
      const stored = guided('guid-1', { url: URL, text: 'Real text about the story, long enough' })
      const incoming = linked({ title: 'Story, edited' })

      expect(Items.mergeItems([stored], [incoming])).toEqual([
        { ...stored, title: 'Story, edited' },
      ])
    })

    test('an incoming guid item merges into the stored link copy and keeps the stored id', () => {
      const stored = linked()
      const incoming = guided('guid-1', {
        url: URL,
        text: 'Real text about the story, long enough',
      })

      expect(Items.mergeItems([stored], [incoming])).toEqual([{ ...incoming, id: stored.id }])
    })

    test('the incoming title and text win when it has text of its own', () => {
      const stored = guided('guid-1', { url: URL, text: 'Old text of the story, long enough' })
      const incoming = linked({ title: 'New title', text: 'New text of the story' })

      expect(Items.mergeItems([stored], [incoming])).toEqual([
        { ...stored, title: 'New title', text: 'New text of the story' },
      ])
    })

    test('a link label as text counts as none, so the real text stays', () => {
      const stored = guided('guid-1', { url: URL, text: 'Real text about the story, long enough' })

      expect(Items.mergeItems([stored], [linked({ text: 'Comments' })])[0]?.text).toBe(stored.text)
      expect(Items.mergeItems([stored], [linked({ text: '' })])[0]?.text).toBe(stored.text)
      expect(
        Items.mergeItems([linked()], [guided('guid-1', { url: URL, text: 'Real text' })])[0]?.text,
      ).toBe('Real text')
    })

    test('the folded item adds the date and language the winning copy lacks', () => {
      const { publishedAt, ...undated } = guided('guid-1', { url: URL })
      const incoming = linked({ publishedAt: '2026-02-02T00:00:00Z', lang: 'en' })

      expect(publishedAt).toBeDefined()
      expect(Items.mergeItems([undated], [incoming])[0]).toMatchObject({
        id: 'src:guid-1',
        publishedAt: '2026-02-02T00:00:00Z',
        lang: 'en',
      })
    })

    test('scheme and host case, a fragment and a trailing slash do not tell stories apart; a query does', () => {
      const stored = guided('guid-1', { url: URL })
      const same = guided('HTTPS://Example.com/story/#comments', {
        url: 'HTTPS://Example.com/story/#comments',
      })

      const other = guided('https://example.com/story?page=2', {
        url: 'https://example.com/story?page=2',
      })

      expect(idsOf(Items.mergeItems([stored], [same]))).toEqual(['guid-1'])
      expect(idsOf(Items.mergeItems([stored], [other])).sort()).toEqual([
        'guid-1',
        'https://example.com/story?page=2',
      ])
    })

    test('stored copies fold into the one with a guid, whichever order they were stored in', () => {
      const guid = guided('guid-1', { url: URL, text: 'The text worth keeping' })
      const copy = linked()

      expect(Items.mergeItems([copy, guid], [])).toEqual([guid])
      expect(Items.mergeItems([guid, copy], [])).toEqual([guid])
    })

    test('several link copies fold into the one guid item', () => {
      const guid = guided('guid-1', { url: URL })
      const copy = linked()
      const other = linked({ url: `${URL}/`, id: `src:${URL}/` })

      expect(idsOf(Items.mergeItems([guid, copy, other], []))).toEqual(['guid-1'])
    })

    test('items without a usable address, and items of other addresses, are untouched', () => {
      const a = { ...Fixtures.itemAt('a'), url: '' }
      const b = { ...Fixtures.itemAt('b'), url: '' }
      const c = Fixtures.itemAt('c')

      expect(idsOf(Items.mergeItems([a, b, c], []))).toEqual(['a', 'b', 'c'])
    })

    test('the same address under two sources stays two items', () => {
      const here = guided('x', { url: URL })
      const there = linked({ sourceId: 'other', id: `other:${URL}` })

      expect(Items.mergeItems([here], [there]).length).toBe(2)
    })

    describe('entries with identifiers of their own at one address stay apart', () => {
      const A = guided('a', { url: URL, publishedAt: '2026-10-03T00:00:00Z' })
      const B = guided('b', { url: URL, publishedAt: '2026-10-02T00:00:00Z' })
      const C = guided('c', { url: URL, publishedAt: '2026-10-01T00:00:00Z' })
      const D = guided('d', { url: URL, publishedAt: '2026-10-04T00:00:00Z' })
      const OLD = guided('old', { url: URL, publishedAt: '2026-09-01T00:00:00Z' })

      test('a first fetch and a repeated one keep all of them', () => {
        let kept = Items.mergeItems([], [A, B, C])

        expect(idsOf(kept)).toEqual(['a', 'b', 'c'])

        kept = Items.mergeItems(kept, [A, B, C])

        expect(idsOf(kept)).toEqual(['a', 'b', 'c'])
      })

      test('loading stored ones folds nothing', () => {
        expect(idsOf(Items.mergeItems([A, B, C], []))).toEqual(['a', 'b', 'c'])
      })

      test('a fetch that lists only some of them loses none', () => {
        expect(idsOf(Items.mergeItems([A, B, C], [A]))).toEqual(['a', 'b', 'c'])
        expect(idsOf(Items.mergeItems([D, A, B, C], [D, A]))).toEqual(['d', 'a', 'b', 'c'])
      })

      test('a fetch of two of them next to a stored one keeps all three', () => {
        expect(idsOf(Items.mergeItems([OLD], [A, B]))).toEqual(['a', 'b', 'old'])
      })

      test('a link copy next to two or more of them folds into none', () => {
        const copy = linked()

        expect(idsOf(Items.mergeItems([A, B, copy], [])).sort()).toEqual(['a', 'b', URL])
        expect(idsOf(Items.mergeItems([A, B], [copy])).sort()).toEqual(['a', 'b', URL])
      })
    })
  })
})
