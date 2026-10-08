import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('pane-model-of', () => {
  const SOURCES = [Fixtures.sourceAt('a', { name: 'Alpha', icon: 'A' })]
  const ITEMS = { a: Fixtures.datedItemsOf('a', 2) }

  test('tabs marked, heading, rows with glyph, link, date and summary; the selected one marked', () => {
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
        icon: 'A',
        title: 'a 1',
        href: 'https://example.com/a/1',
        date: 'Jan 2',
        isSelected: false,
      },
      {
        id: 'a:2',
        icon: 'A',
        title: 'a 2',
        href: 'https://example.com/a/2',
        summary: 'Short.',
        date: 'Jan 1',
        isSelected: true,
      },
    ])
    expect([model.isSavedTab, model.isSelectedSaved]).toEqual([false, false])
  })

  test('on the saved tab: the stored snapshot drawn, a removed source as *, undated with no date', () => {
    const kept = { ...Fixtures.itemAt('kept'), sourceId: 'gone', savedAt: 1 }
    const page = Pane.panePageOf({ tab: 'saved', selected: 0 }, SOURCES, ITEMS, [kept], 10)
    const model = Pane.paneModelOf(page, SOURCES, {}, [kept], 80)

    expect(model.heading).toBe('Saved · 1 of 1')
    expect(model.rows).toEqual([
      {
        id: 'src:kept',
        icon: '*',
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
    const page = Pane.panePageOf({ tab: 'a', selected: 0 }, SOURCES, items, [], 10)
    const model = Pane.paneModelOf(page, SOURCES, { 'a:1': 'Meta.', 'a:2': 'Real.' }, [], 80)

    expect(model.rows.map(row => [row.id, row.summary, row.hasNoSummary, row.date])).toEqual([
      ['a:1', undefined, true, 'Jan 2'],
      ['a:2', 'Real.', undefined, 'Jan 1'],
    ])
  })

  test('an empty summary, replies rejected for now, shows no summary line', () => {
    const page = Pane.panePageOf({ tab: 'a', selected: 0 }, SOURCES, ITEMS, [], 10)
    const [row] = Pane.paneModelOf(page, SOURCES, { 'a:1': '' }, [], 80).rows

    expect(row).toMatchObject({ id: 'a:1', hasNoSummary: true })
    expect(row?.summary).toBeUndefined()
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
    const sources = [Fixtures.sourceAt('a', { name: 'A\nname', icon: '漢x' })]
    const items = { a: [{ ...Fixtures.itemAt('1'), id: 'a:1', sourceId: 'a', title: 'one\ntwo' }] }
    const page = Pane.panePageOf({ tab: 'a', selected: 0 }, sources, items, [], 10)
    const model = Pane.paneModelOf(page, sources, { 'a:1': `x${'y'.repeat(30)}` }, [], 30)

    expect(model.heading).toBe('A name · 1 of 1')
    expect(model.rows[0]?.icon).toBe('…')
    expect(model.rows[0]?.title).toBe('one two')
    expect(model.rows[0]?.summary).toBe(`x${'y'.repeat(24)}…`)
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
