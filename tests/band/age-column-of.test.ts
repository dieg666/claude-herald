import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'

describe('age-column-of', () => {
  test('an age is right-aligned in the four cells of its column, whatever its width', () => {
    expect(Band.ageColumnOf('now')).toBe(' now')
    expect(Band.ageColumnOf('5m')).toBe('  5m')
    expect(Band.ageColumnOf('12mo')).toBe('12mo')
  })

  test('no age leaves the column blank', () => {
    expect(Band.ageColumnOf(undefined)).toBe('    ')
  })
})
