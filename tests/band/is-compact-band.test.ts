import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'

describe('is-compact-band', () => {
  test('compact below the actions line at its widest, 65 cells, for any realistic total', () => {
    for (const total of [1, 7, 156, 9999]) {
      expect([total, Band.isCompactBand(64, total), Band.isCompactBand(65, total)]).toEqual([
        total,
        true,
        false,
      ])
    }

    expect(Band.isCompactBand(40, 156)).toBe(true)
    expect(Band.isCompactBand(174, 156)).toBe(false)
  })

  test('a header wider than the actions line moves the threshold with it', () => {
    const total = 10 ** 9

    expect(Band.headerColumnsOf(total)).toBeGreaterThan(Band.actionsColumnsOf())
    expect(Band.isCompactBand(Band.headerColumnsOf(total) - 1, total)).toBe(true)
    expect(Band.isCompactBand(Band.headerColumnsOf(total), total)).toBe(false)
  })
})
