import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'

describe('short-date-of', () => {
  test('a month and a day, in UTC', () => {
    expect(Pane.shortDateOf('2026-10-08T12:00:00Z')).toBe('Oct 8')
    expect(Pane.shortDateOf('2026-01-01T23:30:00-02:00')).toBe('Jan 2')
    expect(Pane.shortDateOf('2025-12-31T00:00:00Z')).toBe('Dec 31')
  })

  test('no date, or one that does not parse, gives none', () => {
    expect(Pane.shortDateOf(undefined)).toBeUndefined()
    expect(Pane.shortDateOf('yesterday')).toBeUndefined()
  })
})
