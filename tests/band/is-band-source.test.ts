import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'
import Fixtures from '../fixtures'

describe('is-band-source', () => {
  test('an enabled source is on the band unless hidden from it; the pane flag plays no part', () => {
    expect(Band.isBandSource(Fixtures.sourceAt('a'))).toBe(true)
    expect(Band.isBandSource(Fixtures.sourceAt('a', { isOnBand: true }))).toBe(true)
    expect(Band.isBandSource(Fixtures.sourceAt('a', { isInPane: false }))).toBe(true)
    expect(Band.isBandSource(Fixtures.sourceAt('a', { isOnBand: false }))).toBe(false)
  })

  test('a disabled source is never on the band', () => {
    expect(Band.isBandSource(Fixtures.sourceAt('a', { isEnabled: false }))).toBe(false)
    expect(Band.isBandSource(Fixtures.sourceAt('a', { isEnabled: false, isOnBand: true }))).toBe(
      false,
    )
  })
})
