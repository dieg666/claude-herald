import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'
import Fixtures from '../fixtures'
import type { SavedItem } from '../../types/index.js'

describe('band-model-of', () => {
  const SOURCES = [Fixtures.sourceAt('src', { name: 'Hacker News' })]
  const ITEMS = Fixtures.datedItemsOf('src', 4)

  const pageAt = (offset: number, selected: number) =>
    Band.bandPageOf({ offset, selected, isPaused: false }, ITEMS)

  test('rows carry the headline, the source name at the right end, the link and the summary; no glyph; one selected', () => {
    const model = Band.bandModelOf(pageAt(0, 1), SOURCES, { 'src:2': 'Short.' }, [], 80)

    expect(model.range).toBe('1–3 of 4')
    expect(model.isPaused).toBe(false)
    expect(model.rows).toEqual([
      {
        id: 'src:1',
        title: 'src 1',
        source: 'Hacker News',
        sourceGap: ' '.repeat(62),
        href: 'https://example.com/src/1',
        isSelected: false,
      },
      {
        id: 'src:2',
        title: 'src 2',
        source: 'Hacker News',
        sourceGap: ' '.repeat(62),
        href: 'https://example.com/src/2',
        summary: 'Short.',
        isSelected: true,
      },
      {
        id: 'src:3',
        title: 'src 3',
        source: 'Hacker News',
        sourceGap: ' '.repeat(62),
        href: 'https://example.com/src/3',
        isSelected: false,
      },
    ])
  })

  test('the name ends at the last cell of the headline line at 120, 80 and 40 columns; it is dropped when the headline needs the room', () => {
    const title = 'Margaret Hamilton, who led the Apollo software, has died'
    const page = Band.bandPageOf({ offset: 0, selected: 0, isPaused: false }, [
      { ...Fixtures.itemAt('a'), title },
    ])
    const rowAt = (columns: number) => Band.bandModelOf(page, SOURCES, {}, [], columns).rows[0]
    const widthOf = (row: ReturnType<typeof rowAt>) =>
      Band.displayWidthOf(`${row?.title}${row?.sourceGap ?? ''}${row?.source ?? ''}`)

    for (const columns of [120, 80]) {
      expect(rowAt(columns)).toMatchObject({ title, source: 'Hacker News' })
      expect(widthOf(rowAt(columns))).toBe(columns - 2)
    }

    // Thirty-eight cells hold the 56-cell headline cut, and no room is left for a name.
    expect(rowAt(40)?.source).toBeUndefined()
    expect(rowAt(40)?.sourceGap).toBeUndefined()
    expect(rowAt(40)?.title).toBe('Margaret Hamilton, who led the Apollo…')
    expect(widthOf(rowAt(40))).toBe(38)
  })

  test('a name that does not fit is cut before the headline, and dropped before the headline is', () => {
    const page = Band.bandPageOf({ offset: 0, selected: 0, isPaused: false }, [
      { ...Fixtures.itemAt('a'), title: 'A thirty-cell long headline ok' },
    ])
    const rowAt = (columns: number) => Band.bandModelOf(page, SOURCES, {}, [], columns).rows[0]

    expect(rowAt(52)).toMatchObject({
      title: 'A thirty-cell long headline ok',
      source: 'Hacker News',
    })
    // Room for eight cells after the headline and its gap: the name is cut.
    expect(rowAt(42)).toMatchObject({ title: 'A thirty-cell long headline ok', source: 'Hacker…' })
    // Room for five cells, under the minimum: the name is gone and the headline whole.
    expect(rowAt(39)).toEqual(expect.objectContaining({ title: 'A thirty-cell long headline ok' }))
    expect(rowAt(39)?.source).toBeUndefined()
    // Below the headline's own width it is the headline that is cut.
    expect(rowAt(20)).toMatchObject({ title: 'A thirty-cell lon…' })
  })

  test('the header and the actions line each split into two rows below their widest, by the width and the total only', () => {
    const modelAt = (columns: number, saved: readonly SavedItem[] = []) =>
      Band.bandModelOf(pageAt(0, 0), SOURCES, {}, saved, columns)
    const header = Band.headerColumnsOf(ITEMS.length)
    const actions = Band.actionsColumnsOf()

    expect(modelAt(header - 1).isHeaderSplit).toBe(true)
    expect(modelAt(header).isHeaderSplit).toBe(false)
    expect(modelAt(actions - 1).isActionsSplit).toBe(true)
    expect(modelAt(actions).isActionsSplit).toBe(false)
    // Saving the selected item changes the model's saved flag, never its split.
    expect(modelAt(actions - 1, [{ ...ITEMS[0]!, savedAt: 1 }])).toMatchObject({
      isSelectedSaved: true,
      isActionsSplit: true,
    })
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

  test('titles and summaries become one line cut to the width; a gone source shows no name', () => {
    const page = Band.bandPageOf({ offset: 0, selected: 0, isPaused: false }, [
      { ...Fixtures.itemAt('a'), sourceId: 'gone', title: 'Line\none\u0007 '.repeat(5) },
    ])
    const [row] = Band.bandModelOf(page, SOURCES, { 'src:a': 'x\ny'.repeat(10) }, [], 14).rows

    // Fourteen cells less the mark and a space leave twelve for the headline; a summary gets ten.
    expect(row).toMatchObject({ title: 'Line one Li…', summary: 'x yx yx y…' })
    expect(row?.source).toBeUndefined()
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

    expect(rows.map(row => [row.id, row.summary, row.hasNoSummary])).toEqual([
      ['src:a', undefined, true],
      ['src:b', undefined, true],
      ['src:c', 'Real.', undefined],
    ])
  })

  test('an empty summary, replies rejected for now, shows no summary line', () => {
    const [row] = Band.bandModelOf(pageAt(0, 0), SOURCES, { 'src:1': '' }, [], 80).rows

    expect(row).toMatchObject({ id: 'src:1', hasNoSummary: true })
    expect(row?.summary).toBeUndefined()
  })

  test('the selected item reads saved when it is in the saved list', () => {
    const [, second] = ITEMS
    const saved = second === undefined ? [] : [{ ...second, savedAt: 1 }]

    expect(Band.bandModelOf(pageAt(0, 1), SOURCES, {}, saved, 80).isSelectedSaved).toBe(true)
    expect(Band.bandModelOf(pageAt(0, 0), SOURCES, {}, saved, 80).isSelectedSaved).toBe(false)
  })

  test('a title that is only a version leads with its source name and draws no name at the right end; a headline or a gone source does not', () => {
    const sources = [Fixtures.sourceAt('src', { name: 'Claude Code' })]
    const items = [
      { ...Fixtures.itemAt('v2.1.293'), title: 'v2.1.293' },
      { ...Fixtures.itemAt('b'), title: 'Claude Code v2.1.293 adds things' },
      { ...Fixtures.itemAt('c'), sourceId: 'gone', title: 'v1.0.0' },
    ]
    const page = Band.bandPageOf({ offset: 0, selected: 0, isPaused: false }, items)

    expect(Band.bandModelOf(page, sources, {}, [], 80).rows.map(row => row.title)).toEqual([
      'Claude Code v2.1.293',
      'Claude Code v2.1.293 adds things',
      'v1.0.0',
    ])
    expect(Band.bandModelOf(page, sources, {}, [], 80).rows.map(row => row.source)).toEqual([
      undefined,
      'Claude Code',
      undefined,
    ])
    // Twenty cells less the mark and a space leave eighteen.
    expect(Band.bandModelOf(page, sources, {}, [], 20).rows[0]?.title).toBe('Claude Code v2.1.…')
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
    expect(wide.rows.map(row => [row.source, row.sourceGap])).toEqual([
      [undefined, undefined],
      [undefined, undefined],
    ])
  })
})
