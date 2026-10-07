import { describe, expect, test } from 'claude-code/testing'

import Page from '../../hooks/page'

describe('iso-date-of', () => {
  test('a calendar date is midnight UTC', () => {
    expect(Page.isoDateOf('2026-09-22')).toBe('2026-09-22T00:00:00.000Z')
    expect(Page.isoDateOf('  2026-09-22 ')).toBe('2026-09-22T00:00:00.000Z')
  })

  test('a full timestamp keeps its instant, with or without a zone', () => {
    expect(Page.isoDateOf('2026-09-22T10:30:00Z')).toBe('2026-09-22T10:30:00.000Z')
    expect(Page.isoDateOf('2026-09-22T10:30:00+02:00')).toBe('2026-09-22T08:30:00.000Z')
    expect(Page.isoDateOf('2026-09-22T10:30:00-0530')).toBe('2026-09-22T16:00:00.000Z')
    expect(Page.isoDateOf('2026-09-22T10:30:00.123456Z')).toBe('2026-09-22T10:30:00.123Z')
    expect(Page.isoDateOf('2026-09-22 10:30')).toBe('2026-09-22T10:30:00.000Z')
  })

  test('written-out dates read the same in any time zone', () => {
    expect(Page.isoDateOf('Sep 22, 2026')).toBe('2026-09-22T00:00:00.000Z')
    expect(Page.isoDateOf('September 22nd, 2026')).toBe('2026-09-22T00:00:00.000Z')
    expect(Page.isoDateOf('22 Sep 2026')).toBe('2026-09-22T00:00:00.000Z')
    expect(Page.isoDateOf('Tue, 22 Sep 2026 10:00:00 GMT')).toBe('2026-09-22T10:00:00.000Z')
    expect(Page.isoDateOf('Tue, 22 Sep 2026 10:00:00 +0200')).toBe('2026-09-22T08:00:00.000Z')
    expect(Page.isoDateOf('Sept 1, 2026')).toBe('2026-09-01T00:00:00.000Z')
  })

  test('bad dates are undefined', () => {
    for (const value of [
      '',
      'yesterday',
      'N/A',
      'null',
      '2026-13-01',
      '2026-02-30',
      '2026-09-22T25:00:00Z',
      '2026-09-22T10:00:00+99:00',
      'Smarch 3, 2026',
      'Sep 31, 2026',
      '0001-01-01',
      '9999-12-31',
      '1999999999',
      'x'.repeat(100),
    ]) {
      expect(Page.isoDateOf(value)).toBeUndefined()
    }
  })

  test('a value that is not a string is undefined', () => {
    for (const value of [undefined, null, 1790000000, {}, [], true]) {
      expect(Page.isoDateOf(value)).toBeUndefined()
    }
  })
})
