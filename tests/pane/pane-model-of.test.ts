import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'
import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('pane-model-of', () => {
  const SOURCES = [Fixtures.sourceAt('a', { name: 'Alpha' })]
  const ITEMS = { a: Fixtures.datedItemsOf('a', 2) }

  test('tabs marked, heading, rows with link and date and no source mark; the selected one marked, with its summary', () => {
    const page = Pane.panePageOf({ tab: 'a', selected: 1 }, SOURCES, ITEMS, [], 10)
    const model = Pane.paneModelOf(page, SOURCES, { 'a:2': 'Short.' }, [], 80)

    expect(model.tabs.map(tab => [tab.id, tab.isActive])).toEqual([
      ['a', true],
      ['saved', false],
    ])
    expect(model.heading).toBe('Alpha · 1-2 of 2')
    expect(model.rows).toEqual([
      {
        id: 'a:1',
        title: 'a 1',
        href: 'https://example.com/a/1',
        date: 'Jan 2',
        isSelected: false,
      },
      {
        id: 'a:2',
        title: 'a 2',
        href: 'https://example.com/a/2',
        summaryLines: ['Short.'],
        date: 'Jan 1',
        isSelected: true,
      },
    ])
    expect([model.isSavedTab, model.isSelectedSaved]).toEqual([false, false])
  })

  test('on the saved tab: the stored snapshot drawn, a removed source with no name, undated with no date', () => {
    const kept = { ...Fixtures.itemAt('kept'), sourceId: 'gone', savedAt: 1 }
    const page = Pane.panePageOf({ tab: 'saved', selected: 0 }, SOURCES, ITEMS, [kept], 10)
    const model = Pane.paneModelOf(page, SOURCES, {}, [kept], 80)

    expect(model.heading).toBe('Saved · 1 of 1')
    expect(model.rows).toEqual([
      {
        id: 'src:kept',
        title: 'kept',
        href: 'https://example.com/kept',
        isSelected: true,
      },
    ])
    expect([model.isSavedTab, model.isSelectedSaved]).toEqual([true, true])
  })

  test('an item without usable text is marked so and shows no summary, even a cached one', () => {
    const items = {
      a: Fixtures.datedItemsOf('a', 2).map((item, index) =>
        index === 0 ? { ...item, text: '' } : item,
      ),
    }
    const modelAt = (selected: number) =>
      Pane.paneModelOf(
        Pane.panePageOf({ tab: 'a', selected }, SOURCES, items, [], 10),
        SOURCES,
        { 'a:1': 'Meta.', 'a:2': 'Real.' },
        [],
        80,
      )

    expect(modelAt(0).rows.map(row => [row.id, row.summaryLines, row.hasNoSummary])).toEqual([
      ['a:1', undefined, true],
      ['a:2', undefined, undefined],
    ])
    expect(modelAt(1).rows.map(row => [row.id, row.summaryLines, row.hasNoSummary])).toEqual([
      ['a:1', undefined, true],
      ['a:2', ['Real.'], undefined],
    ])
  })

  test('only the selected row carries its summary, wrapped to the width after the indent on at most three lines', () => {
    const text = Array.from({ length: 10 }, (_, index) => `w${index}`).join(' ')
    const page = Pane.panePageOf({ tab: 'a', selected: 0 }, SOURCES, ITEMS, [], 10)
    const rows = Pane.paneModelOf(page, SOURCES, { 'a:1': text, 'a:2': 'Short.' }, [], 12).rows

    // Eight cells after the four-cell indent hold three words a line; the fourth line's words are cut.
    expect(rows.map(row => row.summaryLines)).toEqual([
      ['w0 w1 w2', 'w3 w4 w5', 'w6 w7…'],
      undefined,
    ])
    expect(rows.every(row => row.summary === undefined)).toBe(true)
  })

  test('a long title is cut so its date fits whole at the end of the line', () => {
    const items = {
      a: Fixtures.datedItemsOf('a', 1).map(item => ({ ...item, title: 't'.repeat(40) })),
    }
    const page = Pane.panePageOf({ tab: 'a', selected: 0 }, SOURCES, items, [], 10)
    const [row] = Pane.paneModelOf(page, SOURCES, {}, [], 30).rows

    // Thirty cells less the mark and its space and the seven-cell date column leave twenty-one.
    expect([row?.title, row?.date]).toEqual([`${'t'.repeat(20)}…`, 'Jan 2'])
  })

  test('an empty summary, replies rejected for now, shows no summary line', () => {
    const page = Pane.panePageOf({ tab: 'a', selected: 0 }, SOURCES, ITEMS, [], 10)
    const [row] = Pane.paneModelOf(page, SOURCES, { 'a:1': '' }, [], 80).rows

    expect(row).toMatchObject({ id: 'a:1', hasNoSummary: true })
    expect(row?.summary).toBeUndefined()
  })

  test('on the saved tab a version-only title leads with its source name; the source tab keeps the bare tag', () => {
    const tag = { ...Fixtures.itemAt('v1.2.3'), sourceId: 'a', title: 'v1.2.3' }
    const kept = [
      { ...tag, savedAt: 1 },
      { ...tag, id: 'gone:v1', sourceId: 'gone', savedAt: 2 },
    ]
    const own = Pane.paneModelOf(
      Pane.panePageOf({ tab: 'a', selected: 0 }, SOURCES, { a: [tag] }, kept, 10),
      SOURCES,
      {},
      kept,
      80,
    )
    const saved = Pane.paneModelOf(
      Pane.panePageOf({ tab: 'saved', selected: 0 }, SOURCES, { a: [tag] }, kept, 10),
      SOURCES,
      {},
      kept,
      80,
    )

    expect(own.rows.map(row => row.title)).toEqual(['v1.2.3'])
    expect(saved.rows.map(row => row.title)).toEqual(['Alpha v1.2.3', 'v1.2.3'])
  })

  test('on the saved tab the source name follows the headline, cut first, before the date column, with no padding of its own; a source tab has none', () => {
    const sources = [Fixtures.sourceAt('a', { name: 'Simon Willison' })]
    const title = 'Margaret Hamilton, who led the Apollo software, has died'
    const kept = [{ ...Fixtures.datedItemsOf('a', 1)[0]!, title, savedAt: 1 }]
    const pageAt = (tab: string) =>
      Pane.panePageOf({ tab, selected: 0 }, sources, { a: kept }, kept, 10)
    const rowAt = (tab: string, columns: number) =>
      Pane.paneModelOf(pageAt(tab), sources, {}, kept, columns).rows[0]

    // The mark and its space take two cells, the date column seven; the name needs two cells of gap.
    for (const columns of [120, 81]) {
      const row = rowAt('saved', columns)

      expect(row).toEqual({
        id: 'a:1',
        title,
        source: 'Simon Willison',
        href: 'https://example.com/a/1',
        date: 'Jan 2',
        isSelected: true,
      })
      expect(Band.displayWidthOf(`${row?.title}  ${row?.source}`) <= columns - 9).toBe(true)
    }

    // A name is cut before the headline is, down to six cells, then dropped.
    expect(rowAt('saved', 80)).toMatchObject({ title, source: 'Simon Willis…' })
    expect(rowAt('saved', 73)).toMatchObject({ title, source: 'Simon…' })
    expect(rowAt('saved', 72)?.source).toBeUndefined()
    expect(rowAt('saved', 72)?.title).toBe(title)
    // At forty columns the headline needs the room: the name goes, then the headline is cut.
    expect(rowAt('saved', 40)?.source).toBeUndefined()
    expect(rowAt('saved', 40)?.title).toBe('Margaret Hamilton, who led the…')
    expect(rowAt('a', 120)?.source).toBeUndefined()
    expect(rowAt('a', 120)).toMatchObject({ title, date: 'Jan 2' })
  })

  test('an empty tab names itself and says so', () => {
    const empty = Pane.paneModelOf(
      Pane.panePageOf({ tab: 'a', selected: 0 }, SOURCES, {}, [], 10),
      SOURCES,
      {},
      [],
      80,
    )
    const saved = Pane.paneModelOf(
      Pane.panePageOf({ tab: 'saved', selected: 0 }, SOURCES, {}, [], 10),
      SOURCES,
      {},
      [],
      80,
    )

    expect([empty.heading, empty.rows, empty.empty]).toEqual([
      'Alpha',
      [],
      'Nothing from Alpha yet.',
    ])
    expect([saved.heading, saved.empty]).toEqual([
      'Saved',
      'Nothing saved yet: press v on an item to keep it here.',
    ])
  })

  test('feed text is one line and every line fits the width', () => {
    const sources = [Fixtures.sourceAt('a', { name: 'A\nname' })]
    const items = { a: [{ ...Fixtures.itemAt('1'), id: 'a:1', sourceId: 'a', title: 'one\ntwo' }] }
    const page = Pane.panePageOf({ tab: 'a', selected: 0 }, sources, items, [], 10)
    const model = Pane.paneModelOf(page, sources, { 'a:1': `x${'y'.repeat(30)}` }, [], 30)

    expect(model.heading).toBe('A name · 1 of 1')
    expect(model.rows[0]?.icon).toBeUndefined()
    expect(model.rows[0]?.title).toBe('one two')
    expect(model.rows[0]?.summaryLines).toEqual([`x${'y'.repeat(25)}`, 'yyyyy'])
  })

  test('on the stack tab: one-line rows under ecosystem headings, the summary line, the filter and whether the selected package is expanded', () => {
    const stack = { items: Fixtures.STACK_RELEASES, filter: '', expanded: ['npm:jsdom'] }
    const pageAt = (selected: number) =>
      Pane.panePageOf({ tab: '@stack', selected }, SOURCES, ITEMS, [], 20, stack)
    const model = Pane.paneModelOf(pageAt(2), SOURCES, {}, [], 80, '')

    expect(model.heading).toBe('Your stack · 1-10 of 10')
    expect(model.summary).toBe('7 packages behind · 2 security · 1 breaking')
    expect(model.filter).toBe('')
    expect(model.isExpanded).toBe(true)
    expect(model.rows.map(row => row.heading).filter(Boolean)).toEqual(['npm', 'PyPI'])
    expect(model.rows.every(row => row.cells !== undefined && row.summary === undefined)).toBe(true)
    expect(Pane.paneModelOf(pageAt(0), SOURCES, {}, [], 80, '').isExpanded).toBe(false)
    expect(Pane.paneModelOf(pageAt(0), SOURCES, {}, [], 20, '').summary).toBe(
      '7 packages behind ·…',
    )

    const empty = Pane.paneModelOf(
      Pane.panePageOf({ tab: '@stack', selected: 0 }, SOURCES, ITEMS, [], 20, {
        ...stack,
        items: [],
      }),
      SOURCES,
      {},
      [],
      80,
      '',
    )

    expect([empty.summary, empty.isExpanded, empty.empty]).toEqual([
      undefined,
      undefined,
      'No new release of your dependencies at this level.',
    ])
  })
})
