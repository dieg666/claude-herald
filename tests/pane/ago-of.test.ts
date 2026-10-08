import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'

describe('ago-of', () => {
  const MINUTE = 60_000

  test('just now under a minute, then minutes, hours and days, rounded down', () => {
    expect(Pane.agoOf(0, 59_999)).toBe('just now')
    expect(Pane.agoOf(0, MINUTE)).toBe('1 min ago')
    expect(Pane.agoOf(0, 59 * MINUTE + 59_999)).toBe('59 min ago')
    expect(Pane.agoOf(0, 60 * MINUTE)).toBe('1 h ago')
    expect(Pane.agoOf(0, 2 * 60 * MINUTE + 30 * MINUTE)).toBe('2 h ago')
    expect(Pane.agoOf(0, 24 * 60 * MINUTE - 1)).toBe('23 h ago')
    expect(Pane.agoOf(0, 3 * 24 * 60 * MINUTE + 5)).toBe('3 d ago')
  })

  test('a time ahead of the clock, or not a number, reads just now', () => {
    expect(Pane.agoOf(10 * MINUTE, 0)).toBe('just now')
    expect(Pane.agoOf(Number.NaN, 0)).toBe('just now')
  })
})
