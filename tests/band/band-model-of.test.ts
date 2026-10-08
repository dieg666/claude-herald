import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'
import Fixtures from '../fixtures'

describe('band-model-of', () => {
  const SOURCES = [Fixtures.sourceAt('src', { icon: 'S' })]
  const ITEMS = Fixtures.datedItemsOf('src', 4)

  const pageAt = (offset: number, selected: number) =>
    Band.bandPageOf({ offset, selected, isPaused: false }, ITEMS)

  test('rows carry the glyph, the headline, the link and the summary; one selected', () => {
    const model = Band.bandModelOf(pageAt(0, 1), SOURCES, { 'src:2': 'Short.' }, [], 80)

    expect(model.range).toBe('1-3 of 4')
    expect(model.isPaused).toBe(false)
    expect(model.rows).toEqual([
      {
        id: 'src:1',
        icon: 'S',
        title: 'src 1',
        href: 'https://example.com/src/1',
        isSelected: false,
      },
      {
        id: 'src:2',
        icon: 'S',
        title: 'src 2',
        href: 'https://example.com/src/2',
        summary: 'Short.',
        isSelected: true,
      },
      {
        id: 'src:3',
        icon: 'S',
        title: 'src 3',
        href: 'https://example.com/src/3',
        isSelected: false,
      },
    ])
  })

  test('the last page of one reads N of N', () => {
    expect(Band.bandModelOf(pageAt(3, 0), SOURCES, {}, [], 80).range).toBe('4 of 4')
  })

  test('only http(s) addresses become links', () => {
    for (const url of ['javascript:alert(1)', 'file:///etc/hosts', 'data:text/html,x', 'news']) {
      const page = Band.bandPageOf({ offset: 0, selected: 0, isPaused: false }, [
        { ...Fixtures.itemAt('a'), url },
      ])

      expect(Band.bandModelOf(page, SOURCES, {}, [], 80).rows[0]?.href).toBeUndefined()
    }
  })

  test('titles and summaries become one line cut to the width; a missing glyph reads *', () => {
    const page = Band.bandPageOf({ offset: 0, selected: 0, isPaused: false }, [
      { ...Fixtures.itemAt('a'), sourceId: 'gone', title: 'Line\none\u0007 '.repeat(5) },
    ])
    const [row] = Band.bandModelOf(page, SOURCES, { 'src:a': 'x\ny'.repeat(10) }, [], 14).rows

    // Fourteen cells less the mark, the glyph and two spaces leave ten; a summary gets ten too.
    expect(row).toMatchObject({ icon: '*', title: 'Line one…', summary: 'x yx yx y…' })
  })

  test('an item without usable text is marked so and shows no summary, even a cached one', () => {
    const page = Band.bandPageOf({ offset: 0, selected: 0, isPaused: false }, [
      { ...Fixtures.itemAt('a'), text: '' },
      { ...Fixtures.itemAt('b'), text: 'b' },
      Fixtures.itemAt('c'),
    ])
    const rows = Band.bandModelOf(
      page,
      SOURCES,
      { 'src:a': 'Meta.', 'src:b': 'Meta.', 'src:c': 'Real.' },
      [],
      80,
    ).rows

    expect(rows.map(row => [row.id, row.summary, row.isTextless])).toEqual([
      ['src:a', undefined, true],
      ['src:b', undefined, true],
      ['src:c', 'Real.', undefined],
    ])
  })

  test('the selected item reads saved when it is in the saved list', () => {
    const [, second] = ITEMS
    const saved = second === undefined ? [] : [{ ...second, savedAt: 1 }]

    expect(Band.bandModelOf(pageAt(0, 1), SOURCES, {}, saved, 80).isSelectedSaved).toBe(true)
    expect(Band.bandModelOf(pageAt(0, 0), SOURCES, {}, saved, 80).isSelectedSaved).toBe(false)
  })

  test('a stack item shows 📦 or ⚠, pkg current → new with the title when there is room, and its level as the summary', () => {
    const [react, vite] = Fixtures.STACK_SAMPLE
    const page = Band.bandPageOf({ offset: 0, selected: 0, isPaused: false }, [react!, vite!])
    const wide = Band.bandModelOf(page, SOURCES, { [react?.id ?? '']: 'Ignored.' }, [], 80)
    const narrow = Band.bandModelOf(page, SOURCES, {}, [], 31)

    expect(wide.rows.map(row => [row.icon, row.title, row.summary, row.href])).toEqual([
      [
        '⚠',
        'react 18.2.0 → 19.0.0 · React 19',
        'npm · major · breaking',
        'https://github.com/owner/react/releases/tag/v19.0.0',
      ],
      [
        '📦',
        'vite 5.0.0 → 5.1.0',
        'npm · minor',
        'https://github.com/owner/vite/releases/tag/v5.1.0',
      ],
    ])
    expect(narrow.rows[0]?.title).toBe('react 18.2.0 → 19.0.0 · R…')
  })
})
