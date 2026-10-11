import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'

describe('band-size-of', () => {
  test('a whole number from 1 to 9 is kept', () => {
    for (const size of [1, 3, 5, 9]) {
      expect(Store.bandSizeOf(size)).toBe(size)
    }
  })

  test('a whole number outside 1 to 9 is clamped to the nearer bound', () => {
    expect(Store.bandSizeOf(0)).toBe(1)
    expect(Store.bandSizeOf(-4)).toBe(1)
    expect(Store.bandSizeOf(10)).toBe(9)
    expect(Store.bandSizeOf(50)).toBe(9)
  })

  test('anything but a whole number is the default, three', () => {
    for (const value of [undefined, null, 'x', '5', 4.5, Number.NaN, Infinity, true, {}]) {
      expect(Store.bandSizeOf(value)).toBe(3)
    }
  })
})
