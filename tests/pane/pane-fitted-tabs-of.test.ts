import { describe, expect, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'
import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('pane-fitted-tabs-of', () => {
  const SAVED = [1, 2].map(n => ({ ...Fixtures.itemAt(`k${n}`), savedAt: n }))
  const TABS = Pane.paneTabsOf(
    [
      Fixtures.sourceAt('a', { name: 'Alpha' }),
      Fixtures.sourceAt('long', { name: 'Claude Code releases' }),
    ],
    undefined,
    SAVED,
  )
  const enabled = Defaults.FACTORY_SOURCES.filter(source => source.isEnabled)
  const stack = { items: [], filter: '', expanded: [] }
  const linesAt = (sources: typeof enabled, columns: number) =>
    Pane.wrappedLinesOf(
      Pane.paneFittedTabsOf(Pane.paneTabsOf(sources, stack, []), columns).map(tab =>
        Pane.paneTabSpellingOf(tab),
      ),
      columns,
    )

  const labelsAt = (columns: number) =>
    Pane.paneFittedTabsOf(TABS, columns).map(tab => Pane.paneTabSpellingOf(tab))

  test('full names where they fit one line', () => {
    // `1: Alpha  2: Claude Code releases  0: Saved 2` is forty-five cells.
    expect(labelsAt(45)).toEqual(['1: Alpha', '2: Claude Code releases', '0: Saved 2'])
  })

  test('cut names where they save a line', () => {
    // Cut, the row is forty-one cells: one line at 41 to 44, where the full names take two.
    expect(labelsAt(44)).toEqual(['1: Alpha', '2: Claude Code rel…', '0: Saved 2'])
    expect(labelsAt(41)).toEqual(['1: Alpha', '2: Claude Code rel…', '0: Saved 2'])
  })

  test('full names again where cutting saves no line', () => {
    expect(labelsAt(40)).toEqual(['1: Alpha', '2: Claude Code releases', '0: Saved 2'])
  })

  test('a full name wider than the row is cut to keep it on one line; columns that are not a number count as 80', () => {
    const long = Pane.paneTabsOf([Fixtures.sourceAt('x', { name: 'x'.repeat(100) })]).slice(0, 1)

    expect(Pane.paneFittedTabsOf(long, 30).map(tab => Pane.paneTabSpellingOf(tab))).toEqual([
      `1: ${'x'.repeat(26)}…`,
    ])
    expect(Pane.paneFittedTabsOf(TABS, Number.NaN)).toEqual(Pane.paneFittedTabsOf(TABS, 80))
  })

  const minColumnsOf = (sources: typeof enabled) =>
    Array.from({ length: 400 }, (_, i) => i + 1).find(columns => linesAt(sources, columns) === 1)

  test('the nine enabled sources, Your stack and Saved take one line from 146 cells and two lines at 100', () => {
    // Spelled `1: Anthropic` to `9: GitHub`, `y: Your stack` and `0: Saved`: 126 cells and ten two-cell gaps.
    expect(enabled.length).toBe(9)
    expect(minColumnsOf(enabled)).toBe(146)
    expect(linesAt(enabled, 146)).toBe(1)
    expect(linesAt(enabled, 145)).toBe(2)
    expect(linesAt(enabled, 100)).toBe(2)
  })

  test('the short labels need fewer cells for one line than the full names do', () => {
    const own = enabled.map(source => ({ ...source, id: `own-${source.id}` }))

    expect([minColumnsOf(own), minColumnsOf(enabled)]).toEqual([195, 146])
  })

  test('tabs spell the short labels in full, none cut to sixteen cells', () => {
    const spelled = Pane.paneFittedTabsOf(Pane.paneTabsOf(enabled, stack, []), 148).map(tab =>
      Pane.paneTabSpellingOf(tab),
    )

    expect(spelled).toEqual([
      '1: Anthropic',
      '2: Claude Code',
      '3: Agent SDK',
      '4: Python SDK',
      '5: MCP spec',
      '6: Hacker News',
      '7: Willison',
      '8: AINews',
      '9: GitHub',
      'y: Your stack',
      '0: Saved',
    ])
  })
})
