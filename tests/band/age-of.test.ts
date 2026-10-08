import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'

describe('age-of', () => {
  const NOW = Date.UTC(2026, 9, 8, 12)
  const MINUTE = 60_000
  const HOUR = 60 * MINUTE
  const DAY = 24 * HOUR
  const ageAt = (ms: number) => Band.ageOf(new Date(NOW - ms).toISOString(), NOW)

  test('under a minute reads now, a date a little ahead of the clock too', () => {
    expect(ageAt(0)).toBe('now')
    expect(ageAt(MINUTE - 1)).toBe('now')
    expect(ageAt(-HOUR)).toBe('now')
    expect(ageAt(-Band.AGE_AHEAD_MS)).toBe('now')
  })

  test('minutes, rounded down, up to the hour', () => {
    expect(ageAt(MINUTE)).toBe('1m')
    expect(ageAt(5 * MINUTE + 59_999)).toBe('5m')
    expect(ageAt(HOUR - 1)).toBe('59m')
  })

  test('hours, rounded down, up to the day', () => {
    expect(ageAt(HOUR)).toBe('1h')
    expect(ageAt(DAY - 1)).toBe('23h')
  })

  test('days up to the week, weeks up to the month', () => {
    expect(ageAt(DAY)).toBe('1d')
    expect(ageAt(7 * DAY - 1)).toBe('6d')
    expect(ageAt(7 * DAY)).toBe('1w')
    expect(ageAt(21 * DAY)).toBe('3w')
    expect(ageAt(30 * DAY - 1)).toBe('4w')
  })

  test('months up to the year, then years capped at 99y', () => {
    expect(ageAt(30 * DAY)).toBe('1mo')
    expect(ageAt(120 * DAY)).toBe('4mo')
    expect(ageAt(364 * DAY)).toBe('12mo')
    expect(ageAt(365 * DAY)).toBe('1y')
    expect(ageAt(3 * 365 * DAY)).toBe('3y')
    expect(Band.ageOf('1900-01-01T00:00:00Z', Date.UTC(2026, 0, 1))).toBe('99y')
  })

  test('no age for no date, an unparsable one, a date too far ahead or a clock that is not a number', () => {
    expect(Band.ageOf(undefined, NOW)).toBeUndefined()
    expect(Band.ageOf('', NOW)).toBeUndefined()
    expect(Band.ageOf('yesterday-ish', NOW)).toBeUndefined()
    expect(ageAt(-Band.AGE_AHEAD_MS - MINUTE)).toBeUndefined()
    expect(Band.ageOf(new Date(NOW).toISOString(), Number.NaN)).toBeUndefined()
  })

  test('every age fits the age column, over a sweep from now to a century back', () => {
    for (const days of [0, 0.5, 1, 6, 7, 29, 30, 99, 359, 364, 365, 3650, 40_000]) {
      const age = ageAt(days * DAY)

      expect(Band.displayWidthOf(age ?? '')).toBeLessThanOrEqual(Band.AGE_COLUMNS)
    }
  })
})
