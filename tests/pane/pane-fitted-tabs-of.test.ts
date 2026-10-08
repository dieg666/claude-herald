import { describe, expect, test } from 'claude-code/testing'

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
})
