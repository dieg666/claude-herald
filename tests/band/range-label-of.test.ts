import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'

describe('range-label-of', () => {
  test('a range joins its numbers with a hyphen unless a dash is given; a page of one has no range', () => {
    expect(Band.rangeLabelOf({ start: 6, count: 3, selected: 0 }, 156)).toBe('7-9 of 156')
    expect(Band.rangeLabelOf({ start: 6, count: 3, selected: 0 }, 156, '–')).toBe('7–9 of 156')
    expect(Band.rangeLabelOf({ start: 6, count: 1, selected: 0 }, 7, '–')).toBe('7 of 7')
  })

  test('the position of a page of five and of a page of one, the last page short', () => {
    const labelAt = (offset: number, total: number, size: number) =>
      Band.rangeLabelOf(
        Band.bandSpanOf({ offset, selected: 0, isPaused: false }, total, size),
        total,
      )

    expect([labelAt(0, 12, 5), labelAt(5, 12, 5), labelAt(10, 12, 5)]).toEqual([
      '1-5 of 12',
      '6-10 of 12',
      '11-12 of 12',
    ])
    expect([labelAt(0, 12, 1), labelAt(11, 12, 1), labelAt(30, 12, 1)]).toEqual([
      '1 of 12',
      '12 of 12',
      '12 of 12',
    ])
  })
})
