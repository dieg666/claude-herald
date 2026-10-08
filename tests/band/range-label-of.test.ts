import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'

describe('range-label-of', () => {
  test('a range joins its numbers with a hyphen unless a dash is given; a page of one has no range', () => {
    expect(Band.rangeLabelOf({ start: 6, count: 3, selected: 0 }, 156)).toBe('7-9 of 156')
    expect(Band.rangeLabelOf({ start: 6, count: 3, selected: 0 }, 156, '–')).toBe('7–9 of 156')
    expect(Band.rangeLabelOf({ start: 6, count: 1, selected: 0 }, 7, '–')).toBe('7 of 7')
  })
})
