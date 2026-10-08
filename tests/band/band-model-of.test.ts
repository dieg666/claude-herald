import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'
import Defaults from '../../hooks/defaults'
import Fixtures from '../fixtures'

describe('band-model-of', () => {
  const SOURCES = [Fixtures.sourceAt('src', { name: 'Hacker News' })]
  const ITEMS = Fixtures.datedItemsOf('src', 4)

  const pageAt = (offset: number, selected: number) =>
    Band.bandPageOf({ offset, selected, isPaused: false }, ITEMS)

  // The cells before a row's headline: the mark and a space, the glyph and its gap, the label and its gap.
  const leadOf = (row: { icon?: string; source: string; sourceGap: string } | undefined) =>
    Band.displayWidthOf(
      `› ${row?.icon ?? ''}${row?.icon === undefined ? '' : Band.iconGapOf(row.icon)}${row?.source}${row?.sourceGap}`,
    )

  test('rows carry the source column, the headline, the link and the summary; no glyph; one selected', () => {
    const model = Band.bandModelOf(pageAt(0, 1), SOURCES, { 'src:2': 'Short.' }, [], 80, true)

    expect(model.range).toBe('1–3 of 4')
    expect(model.isPaused).toBe(false)
    expect(model.rows).toEqual([
      {
        id: 'src:1',
        source: 'Hacker News',
        sourceGap: '   ',
        title: 'src 1',
        href: 'https://example.com/src/1',
        isSelected: false,
      },
      {
        id: 'src:2',
        source: 'Hacker News',
        sourceGap: '   ',
        title: 'src 2',
        href: 'https://example.com/src/2',
        summary: 'Short.',
        isSelected: true,
      },
      {
        id: 'src:3',
        source: 'Hacker News',
        sourceGap: '   ',
        title: 'src 3',
        href: 'https://example.com/src/3',
        isSelected: false,
      },
    ])
  })

  test('every headline starts after the twelve-cell column and its gap at 174, 120 and 80 columns, a long name cut with …, and takes the rest of the line', () => {
    const title = 'Margaret Hamilton, who led the Apollo software, has died'
    const sources = [
      Fixtures.sourceAt('hn', { name: 'HN' }),
      Fixtures.sourceAt('sw', { name: 'Simon Willison' }),
      Fixtures.sourceAt('src', { name: 'Hacker News' }),
    ]
    const page = Band.bandPageOf(
      { offset: 0, selected: 0, isPaused: false },
      ['hn', 'sw', 'src'].map(sourceId => ({ ...Fixtures.itemAt(sourceId), sourceId, title })),
    )

    for (const columns of [174, 120, 80]) {
      const { rows } = Band.bandModelOf(page, sources, {}, [], columns, true)

      expect(rows.map(row => row.source)).toEqual(['HN', 'Simon Willi…', 'Hacker News'])
      expect(rows.map(leadOf)).toEqual([16, 16, 16])
      expect(rows.map(row => row.title)).toEqual([title, title, title])
    }

    // Sixty-five cells less the sixteen before the headline leave forty-nine.
    const [row] = Band.bandModelOf(page, sources, {}, [], 65, true).rows

    // The cut drops the space before the ellipsis, so the line ends a cell short of 65.
    expect(row?.title).toBe('Margaret Hamilton, who led the Apollo software,…')
    expect(leadOf(row) + Band.displayWidthOf(row?.title ?? '')).toBe(64)
  })

  test('no row carries a name after its headline', () => {
    const { rows } = Band.bandModelOf(pageAt(0, 0), SOURCES, {}, [], 174, true)

    for (const row of rows) {
      expect(row.title.includes('Hacker News')).toBe(false)
      expect(
        Object.keys(row).filter(
          key => !['id', 'source', 'sourceGap', 'title', 'href', 'isSelected'].includes(key),
        ),
      ).toEqual([])
    }
  })

  test('the last page of one reads N of N', () => {
    expect(Band.bandModelOf(pageAt(3, 0), SOURCES, {}, [], 80, true).range).toBe('4 of 4')
  })

  test('only http(s) addresses become links', () => {
    for (const url of ['javascript:alert(1)', 'file:///etc/hosts', 'data:text/html,x', 'news']) {
      const page = Band.bandPageOf({ offset: 0, selected: 0, isPaused: false }, [
        { ...Fixtures.itemAt('a'), url },
      ])

      expect(Band.bandModelOf(page, SOURCES, {}, [], 80, true).rows[0]?.href).toBeUndefined()
    }
  })

  test('titles and summaries become one line cut to the room after the column; a gone source leaves the column blank', () => {
    const page = Band.bandPageOf({ offset: 0, selected: 0, isPaused: false }, [
      { ...Fixtures.itemAt('a'), sourceId: 'gone', title: 'Line\none\u0007 '.repeat(5) },
    ])
    const [row] = Band.bandModelOf(page, SOURCES, { 'src:a': 'x\ny'.repeat(10) }, [], 28, true).rows

    // Twenty-eight cells less the sixteen before the headline leave twelve, for the headline and the summary alike.
    expect(row).toMatchObject({ title: 'Line one Li…', summary: 'x yx yx yx…' })
    expect(row).toMatchObject({ source: '', sourceGap: ' '.repeat(14) })
    expect(row?.isRelease).toBeUndefined()
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
      true,
    ).rows

    expect(rows.map(row => [row.id, row.summary, row.hasNoSummary])).toEqual([
      ['src:a', undefined, true],
      ['src:b', undefined, true],
      ['src:c', 'Real.', undefined],
    ])
  })

  test('an empty summary, replies rejected for now, shows no summary line', () => {
    const [row] = Band.bandModelOf(pageAt(0, 0), SOURCES, { 'src:1': '' }, [], 80, true).rows

    expect(row).toMatchObject({ id: 'src:1', hasNoSummary: true })
    expect(row?.summary).toBeUndefined()
  })

  test('the selected item reads saved when it is in the saved list', () => {
    const [, second] = ITEMS
    const saved = second === undefined ? [] : [{ ...second, savedAt: 1 }]

    expect(Band.bandModelOf(pageAt(0, 1), SOURCES, {}, saved, 80, true).isSelectedSaved).toBe(true)
    expect(Band.bandModelOf(pageAt(0, 0), SOURCES, {}, saved, 80, true).isSelectedSaved).toBe(false)
  })

  test('a title that is only a version is drawn bare after its source name, never repeating it; a release feed or a bare version is a release, a news source is not', () => {
    const sources = [
      Fixtures.sourceAt('rel', {
        name: 'Claude Code',
        url: 'https://github.com/anthropics/claude-code/releases.atom',
      }),
      Fixtures.sourceAt('src', { name: 'Hacker News' }),
    ]
    const items = [
      { ...Fixtures.itemAt('v2.1.293'), sourceId: 'rel', title: 'v2.1.293' },
      { ...Fixtures.itemAt('b'), sourceId: 'rel', title: 'Claude Code v2.1.293 adds things' },
      { ...Fixtures.itemAt('c'), sourceId: 'gone', title: 'v1.0.0' },
      { ...Fixtures.itemAt('d'), title: 'v3.0' },
      { ...Fixtures.itemAt('e'), title: 'The people holding up the internet' },
    ]
    const page = Band.bandPageOf({ offset: 0, selected: 0, isPaused: false }, items, 5)

    expect(
      Band.bandModelOf(page, sources, {}, [], 80, true).rows.map(row => [
        row.source,
        row.title,
        row.isRelease,
      ]),
    ).toEqual([
      ['Claude Code', 'v2.1.293', true],
      ['Claude Code', 'Claude Code v2.1.293 adds things', true],
      ['', 'v1.0.0', true],
      ['Hacker News', 'v3.0', true],
      ['Hacker News', 'The people holding up the internet', undefined],
    ])
  })

  test('a stack item shows 📦 or ⚠ and its package in the column, current → new with the title when there is room, and its level as the summary', () => {
    const [react, vite] = Fixtures.STACK_SAMPLE
    const astro = Fixtures.stackItemAt('@astrojs/node', '11.1.7', {
      current: '9.0.0',
      title: '@astrojs/node@11.1.7',
    })
    const page = Band.bandPageOf({ offset: 0, selected: 0, isPaused: false }, [
      react!,
      vite!,
      astro,
    ])
    const wide = Band.bandModelOf(page, SOURCES, { [react?.id ?? '']: 'Ignored.' }, [], 80, true)
    const narrow = Band.bandModelOf(page, SOURCES, {}, [], 36, true)

    expect(
      wide.rows.map(row => [row.icon, row.source, row.title, row.summary, row.isRelease]),
    ).toEqual([
      ['⚠', 'react', '18.2.0 → 19.0.0 · React 19', 'npm · major · breaking', true],
      ['📦', 'vite', '5.0.0 → 5.1.0', 'npm · minor', true],
      ['📦', 'node', '9.0.0 → 11.1.7', 'npm · minor', true],
    ])
    expect(wide.rows.map(row => row.href)).toEqual([
      'https://github.com/owner/react/releases/tag/v19.0.0',
      'https://github.com/owner/vite/releases/tag/v5.1.0',
      'https://github.com/owner/@astrojs/node/releases/tag/v11.1.7',
    ])
    expect(wide.rows.map(leadOf)).toEqual([16, 16, 16])
    // Thirty-six cells less the sixteen before the headline leave twenty.
    expect(narrow.rows[0]?.title).toBe('18.2.0 → 19.0.0 · R…')
  })

  test('a factory source shows its short label while it keeps its factory name; a renamed one its own name', () => {
    const [releases, sdk] = Defaults.FACTORY_SOURCES.filter(source =>
      ['claude-code-releases', 'claude-agent-sdk-ts'].includes(source.id),
    )
    const sources = [releases!, { ...sdk!, name: 'My SDK feed' }]
    const items = sources.map(source => ({
      ...Fixtures.itemAt(source.id),
      sourceId: source.id,
      title: 'v1.0.0',
    }))
    const page = Band.bandPageOf({ offset: 0, selected: 0, isPaused: false }, items)

    expect(Band.bandModelOf(page, sources, {}, [], 80, true).rows.map(row => row.source)).toEqual([
      'Claude Code',
      'My SDK feed',
    ])
  })
  test('with automatic summaries off every row is one line at 174, 120 and 80 columns: no summary or placeholder, cached, empty or missing', () => {
    const items = [
      Fixtures.itemAt('a'),
      Fixtures.itemAt('b'),
      { ...Fixtures.itemAt('c'), text: '' },
    ]
    const page = Band.bandPageOf({ offset: 0, selected: 1, isPaused: false }, items)
    const summaries = { 'src:a': 'Cached.', 'src:b': '' }

    for (const columns of [174, 120, 80]) {
      const off = Band.bandModelOf(page, SOURCES, summaries, [], columns, false)
      const on = Band.bandModelOf(page, SOURCES, summaries, [], columns, true)

      expect(off.hasSummaries).toBe(false)
      expect(on.hasSummaries).toBe(true)
      expect(off.rows.map(row => [row.id, row.summary, row.hasNoSummary, row.note])).toEqual([
        ['src:a', undefined, undefined, undefined],
        ['src:b', undefined, undefined, undefined],
        ['src:c', undefined, undefined, undefined],
      ])
      expect(off.rows.map(row => [row.title, row.href, row.isSelected])).toEqual(
        on.rows.map(row => [row.title, row.href, row.isSelected]),
      )
    }
  })

  test('with automatic summaries off a stack row carries its note inline, within the room, at 174, 120 and 80 columns, wide package names and titles included', () => {
    const wide = [
      Fixtures.stackItemAt('漢字パッケージ', '2.0.0', {
        current: '1.0.0',
        level: 'major',
        breaking: true,
        title: `漢字のリリース ${'新機能'.repeat(12)}`,
      }),
      Fixtures.stackItemAt('🚀rocket', '1.1.0', { current: '1.0.0' }),
      Fixtures.stackItemAt('plain', '3.0.0', { current: '2.0.0', level: 'major' }),
    ]
    const page = Band.bandPageOf({ offset: 0, selected: 0, isPaused: false }, wide)

    for (const columns of [174, 120, 80]) {
      const { rows } = Band.bandModelOf(page, SOURCES, {}, [], columns, false)

      expect(rows.map(leadOf)).toEqual([16, 16, 16])

      for (const row of rows) {
        const note = row.note === undefined ? 0 : 2 + Band.displayWidthOf(row.note)

        expect(row.summary).toBeUndefined()
        expect(leadOf(row) + Band.displayWidthOf(row.title) + note).toBeLessThanOrEqual(columns)
      }

      expect(rows.slice(1).map(row => row.note)).toEqual(['npm · minor', 'npm · major'])
    }

    expect(Band.bandModelOf(page, SOURCES, {}, [], 174, false).rows[0]?.note).toBe(
      'npm · major · breaking',
    )
  })

  test('with automatic summaries off a page mixing news and stack rows draws one line per row on every page', () => {
    const [react, vite] = Fixtures.STACK_SAMPLE
    const items = [react!, ...Fixtures.datedItemsOf('src', 3), vite!, Fixtures.itemAt('z')]
    const linesOf = (model: ReturnType<typeof Band.bandModelOf>) =>
      model.rows.length + (model.hasSummaries ? model.rows.length : 0)

    for (const offset of [0, 3]) {
      for (const selected of [0, 1, 2]) {
        const page = Band.bandPageOf({ offset, selected, isPaused: false }, items)
        const off = Band.bandModelOf(page, SOURCES, { 'src:1': 'Cached.' }, [], 80, false)

        expect(linesOf(off)).toBe(3)
        expect(off.rows.every(row => row.summary === undefined)).toBe(true)
        expect(linesOf(Band.bandModelOf(page, SOURCES, { 'src:1': 'Cached.' }, [], 80, true))).toBe(
          6,
        )
      }
    }
  })

  test('with automatic summaries off the inline note is dropped when fewer than four cells are left, and cut to four otherwise', () => {
    const item = Fixtures.stackItemAt('pkg', '2.0.0', { current: '1.0.0', level: 'major' })
    const page = Band.bandPageOf({ offset: 0, selected: 0, isPaused: false }, [item])
    const title = Band.bandModelOf(page, SOURCES, {}, [], 174, false).rows[0]?.title ?? ''
    // The lead, the headline and the gap before the note.
    const used = 16 + Band.displayWidthOf(title) + 2

    expect(Band.bandModelOf(page, SOURCES, {}, [], used + 3, false).rows[0]?.note).toBeUndefined()
    expect(Band.bandModelOf(page, SOURCES, {}, [], used + 4, false).rows[0]?.note).toBe('npm…')
    expect(Band.bandModelOf(page, SOURCES, {}, [], used + 4, false).rows[0]?.title).toBe(title)
  })
})
