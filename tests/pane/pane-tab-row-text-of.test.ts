import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'

describe('pane-tab-row-text-of', () => {
  const tabOf = (id: string, label: string, hotkey: string, count?: number) => ({
    id,
    name: label,
    label,
    short: label,
    hotkey,
    ...(count === undefined ? {} : { count }),
  })

  test('the spelling, one cell, then the count token', () => {
    expect(Pane.paneTabRowTextOf(tabOf('a', 'Hacker News', '6', 12))).toBe('6: Hacker News •12')
    expect(Pane.paneTabRowTextOf(tabOf('saved', 'Saved', '0', 2))).toBe('0: Saved (2)')
  })

  test('without a count, the spelling alone', () => {
    expect(Pane.paneTabRowTextOf(tabOf('a', 'Alpha', '1'))).toBe('1: Alpha')
  })

  test('the gap is the one the view draws between the name and the token', () => {
    expect(Pane.PANE_TAB_COUNT_GAP).toBe(1)
  })
})
