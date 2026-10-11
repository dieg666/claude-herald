import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'

describe('band-page-size-of', () => {
  test('one item a page while the band is compact, three otherwise', () => {
    expect(Band.bandPageSizeOf(40, 156)).toBe(1)
    expect(Band.bandPageSizeOf(64, 156)).toBe(1)
    expect(Band.bandPageSizeOf(65, 156)).toBe(Band.BAND_PAGE_SIZE)
    expect(Band.bandPageSizeOf(174, 156)).toBe(3)
  })

  test('the full band holds the size it is given, the compact band still one; a size out of bounds is clamped', () => {
    expect(Band.bandPageSizeOf(174, 156, 5)).toBe(5)
    expect(Band.bandPageSizeOf(174, 156, 1)).toBe(1)
    expect(Band.bandPageSizeOf(174, 156, 9)).toBe(9)
    expect(Band.bandPageSizeOf(64, 156, 5)).toBe(1)
    expect(Band.bandPageSizeOf(64, 156, 9)).toBe(1)
    expect(Band.bandPageSizeOf(174, 156, 0)).toBe(1)
    expect(Band.bandPageSizeOf(174, 156, 50)).toBe(9)
    expect(Band.bandPageSizeOf(174, 156, Number.NaN)).toBe(3)
  })
})
