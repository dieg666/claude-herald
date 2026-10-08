import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'

describe('band-page-size-of', () => {
  test('one item a page while the band is compact, three otherwise', () => {
    expect(Band.bandPageSizeOf(40, 156)).toBe(1)
    expect(Band.bandPageSizeOf(64, 156)).toBe(1)
    expect(Band.bandPageSizeOf(65, 156)).toBe(Band.BAND_PAGE_SIZE)
    expect(Band.bandPageSizeOf(174, 156)).toBe(3)
  })
})
