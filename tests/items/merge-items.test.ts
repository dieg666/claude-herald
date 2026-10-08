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
    const story = (id: string, fields: Record<string, unknown> = {}) => ({
      ...Fixtures.itemAt('story', '2026-01-01T00:00:00Z'),
      id: `src:${id}`,
      ...fields,
    })

    test("an incoming item at a stored item's address merges into it and keeps the stored id", () => {
      const stored = story('guid-1', { text: 'Real text about the story, long enough' })
      const incoming = story('https://example.com/story', { title: 'Story, edited', text: '' })

      expect(Items.mergeItems([stored], [incoming])).toEqual([
        { ...stored, title: 'Story, edited' },
      ])
    })

    test('the incoming title and text win when it has text of its own', () => {
      const stored = story('guid-1', { text: 'Old text of the story, long enough' })
      const incoming = story('other', { title: 'New title', text: 'New text of the story' })

      expect(Items.mergeItems([stored], [incoming])).toEqual([
        { ...stored, title: 'New title', text: 'New text of the story' },
      ])
    })

    test('a link label as text counts as none, so the stored text stays', () => {
      const stored = story('guid-1', { text: 'Real text about the story, long enough' })
      const incoming = story('other', { text: 'Comments' })

      expect(Items.mergeItems([stored], [incoming])[0]?.text).toBe(stored.text)
      expect(
        Items.mergeItems(
          [story('guid-1', { text: 'Comments' })],
          [{ ...incoming, text: 'Real text' }],
        )[0]?.text,
      ).toBe('Real text')
    })

    test('the incoming item adds the date and language the stored one lacks', () => {
      const { publishedAt, ...undated } = story('guid-1')
      const incoming = story('other', { publishedAt: '2026-02-02T00:00:00Z', lang: 'en' })

      expect(publishedAt).toBeDefined()
      expect(Items.mergeItems([undated], [incoming])[0]).toMatchObject({
        id: 'src:guid-1',
        publishedAt: '2026-02-02T00:00:00Z',
        lang: 'en',
      })
    })

    test('scheme and host case, a fragment and a trailing slash do not tell stories apart; a query does', () => {
      const stored = story('guid-1', { url: 'https://example.com/story' })

      const same = story('b', { url: 'HTTPS://Example.com/story/#comments' })
      const other = story('c', { url: 'https://example.com/story?page=2' })

      expect(idsOf(Items.mergeItems([stored], [same]))).toEqual(['guid-1'])
      expect(idsOf(Items.mergeItems([stored], [other])).sort()).toEqual(['c', 'guid-1'])
    })

    test('stored duplicates collapse, keeping the oldest id and the copy with more text', () => {
      const older = story('older', { publishedAt: '2026-01-01T00:00:00Z', text: 'Comments' })
      const newer = story('newer', {
        publishedAt: '2026-01-02T00:00:00Z',
        text: 'The text worth keeping',
      })

      const merged = Items.mergeItems([newer, older], [])

      expect(merged).toEqual([{ ...newer, id: 'src:older' }])
    })

    test('stored duplicates of the same date keep the one with text, else the one stored last', () => {
      const withText = story('with-text')
      const label = story('label', { text: 'Comments' })

      expect(idsOf(Items.mergeItems([withText, label], []))).toEqual(['with-text'])
      expect(idsOf(Items.mergeItems([label, withText], []))).toEqual(['with-text'])
      expect(idsOf(Items.mergeItems([story('first'), story('last')], []))).toEqual(['last'])
    })

    test('items without a usable address, and items of other addresses, are untouched', () => {
      const a = { ...Fixtures.itemAt('a'), url: '' }
      const b = { ...Fixtures.itemAt('b'), url: '' }
      const c = Fixtures.itemAt('c')

      expect(idsOf(Items.mergeItems([a, b, c], []))).toEqual(['a', 'b', 'c'])
    })

    test('the same address under two sources stays two items', () => {
      const here = story('x')
      const there = { ...story('y'), sourceId: 'other', id: 'other:y' }

      expect(Items.mergeItems([here], [there]).length).toBe(2)
    })

    test('entries the fetch lists under their own ids stay apart', () => {
      const a = story('a')
      const b = story('b')

      expect(idsOf(Items.mergeItems([a, b], [a, b]))).toEqual(['a', 'b'])
      expect(idsOf(Items.mergeItems([], [a, b]))).toEqual(['a', 'b'])
    })

    test('a listed item folds into a stored one it shares an address with, even when it is stored too', () => {
      const guid = story('guid-1')
      const dup = story('dup', { text: 'Comments' })

      expect(idsOf(Items.mergeItems([guid, dup], [dup]))).toEqual(['guid-1'])
    })
  })
})
