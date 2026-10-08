import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'

describe('pane-date-of', () => {
  const NOW = Date.UTC(2026, 9, 8, 12, 0, 0)
  const DAY = 86_400_000
  const at = (ms: number) => new Date(NOW - ms).toISOString()

  test('an item less than a day old shows the band age, a day or more old the short date', () => {
    expect(Pane.paneDateOf(at(10_000), NOW)).toBe('now')
    expect(Pane.paneDateOf(at(5 * 60_000), NOW)).toBe('5m')
    expect(Pane.paneDateOf(at(2 * 3_600_000 + 59_000), NOW)).toBe('2h')
    expect(Pane.paneDateOf(at(DAY - 60_000), NOW)).toBe('23h')
    expect(Pane.paneDateOf(at(DAY - 1), NOW)).toBe('23h')
    expect(Pane.paneDateOf(at(DAY), NOW)).toBe('Oct 7')
    expect(Pane.paneDateOf(at(DAY + 1), NOW)).toBe('Oct 7')
    expect(Pane.paneDateOf(at(11 * DAY), NOW)).toBe('Sep 27')
    expect(Pane.paneDateOf('2025-12-31T00:00:00Z', NOW)).toBe('Dec 31')
  })

  test('every date fits the date column', () => {
    const widest = [10_000, 59 * 60_000, 23 * 3_600_000, DAY, 300 * DAY]
      .map(ms => Pane.paneDateOf(at(ms), NOW) ?? '')
      .reduce((most, date) => Math.max(most, date.length), 0)

    expect(widest).toBeLessThanOrEqual(Pane.PANE_DATE_COLUMNS)
  })

  test('a date a little ahead of the clock reads now, one far ahead reads as its date', () => {
    expect(Pane.paneDateOf(new Date(NOW + 3_600_000).toISOString(), NOW)).toBe('now')
    expect(Pane.paneDateOf(new Date(NOW + 3 * DAY).toISOString(), NOW)).toBe('Oct 11')
  })

  test('a clock that is not a number draws the short date', () => {
    expect(Pane.paneDateOf(at(60_000), Number.NaN)).toBe('Oct 8')
  })

  test('no date, or one that does not parse, gives none', () => {
    expect(Pane.paneDateOf(undefined, NOW)).toBeUndefined()
    expect(Pane.paneDateOf('', NOW)).toBeUndefined()
    expect(Pane.paneDateOf('yesterday', NOW)).toBeUndefined()
  })
})
