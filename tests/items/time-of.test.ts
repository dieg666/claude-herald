import { describe, expect, test } from 'claude-code/testing'

import Items from '../../hooks/items'

describe('time-of', () => {
  test('a date sorts by its time; an absent or unparsable one sorts last', () => {
    expect(Items.timeOf('2026-01-02T00:00:00Z')).toBe(Date.UTC(2026, 0, 2))
    expect(Items.timeOf(undefined)).toBe(Number.NEGATIVE_INFINITY)
    expect(Items.timeOf('someday')).toBe(Number.NEGATIVE_INFINITY)
  })
})
