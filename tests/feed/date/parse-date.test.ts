import { describe, expect, test } from 'claude-code/testing'

import Date_ from '../../../hooks/feed/date'

describe('parse-date', () => {
  test('RFC 822 dates with numeric offsets and zone names', () => {
    expect(Date_.parseDate('Wed, 07 Oct 2026 21:23:29 +0000')).toBe('2026-10-07T21:23:29.000Z')
    expect(Date_.parseDate('Wed, 09 Sep 2026 05:44:39 GMT')).toBe('2026-09-09T05:44:39.000Z')
    expect(Date_.parseDate('7 Oct 2026 21:23 EST')).toBe('2026-10-08T02:23:00.000Z')
    expect(Date_.parseDate('Wed, 07 Oct 26 21:23:29 PDT')).toBe('2026-10-08T04:23:29.000Z')
    expect(Date_.parseDate('Wednesday, 07 October 2026 21:23:29 -0230')).toBe(
      '2026-10-07T23:53:29.000Z',
    )
    expect(Date_.parseDate('Wed, 07 Oct 2026 21:23:29 +0000 (UTC)')).toBe(
      '2026-10-07T21:23:29.000Z',
    )
  })

  test('a two-digit RFC 822 year below 50 is 20xx, from 50 on it is 19xx', () => {
    expect(Date_.parseDate('Sat, 02 Oct 99 10:00:00 GMT')).toBe('1999-10-02T10:00:00.000Z')
    expect(Date_.parseDate('02 Oct 50 10:00:00 GMT')).toBe('1950-10-02T10:00:00.000Z')
    expect(Date_.parseDate('02 Oct 49 10:00:00 GMT')).toBe('2049-10-02T10:00:00.000Z')
    expect(Date_.parseDate('02 Oct 00 10:00:00 GMT')).toBe('2000-10-02T10:00:00.000Z')
  })

  test('an RFC 822 date with an unknown zone name, or none, reads as UTC', () => {
    expect(Date_.parseDate('Wed, 07 Oct 2026 21:23:29 XYZ')).toBe('2026-10-07T21:23:29.000Z')
    expect(Date_.parseDate('07 Oct 2026 21:23:29')).toBe('2026-10-07T21:23:29.000Z')
  })

  test('ISO 8601 dates, with or without a zone or a time', () => {
    expect(Date_.parseDate('2026-10-07T18:10:20Z')).toBe('2026-10-07T18:10:20.000Z')
    expect(Date_.parseDate('2026-10-07T20:56:21+00:00')).toBe('2026-10-07T20:56:21.000Z')
    expect(Date_.parseDate('2026-10-02T10:00:00.123456-05:00')).toBe('2026-10-02T15:00:00.123Z')
    expect(Date_.parseDate('  2026-10-07  ')).toBe('2026-10-07T00:00:00.000Z')
    expect(Date_.parseDate('2026-10-07 10:00:00')).toBe('2026-10-07T10:00:00.000Z')
  })

  test('anything unparseable or out of range is undefined', () => {
    for (const text of [
      undefined,
      '',
      'sometime last week',
      '2026-02-30',
      '2026-13-01',
      '2026-10-07T25:00:00Z',
      'Thu, 31 Feb 2026 10:00:00 GMT',
      'Wed, 07 Foo 2026 21:23:29 GMT',
      '0099-01-01',
      `2026-10-07${' '.repeat(10_000)}x`,
    ]) {
      expect(Date_.parseDate(text)).toBeUndefined()
    }
  })
})
