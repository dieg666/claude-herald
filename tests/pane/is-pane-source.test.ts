import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('is-pane-source', () => {
  test('an enabled source is in the pane unless hidden from it; the band flag plays no part', () => {
    expect(Pane.isPaneSource(Fixtures.sourceAt('a'))).toBe(true)
    expect(Pane.isPaneSource(Fixtures.sourceAt('a', { isInPane: true }))).toBe(true)
    expect(Pane.isPaneSource(Fixtures.sourceAt('a', { isOnBand: false }))).toBe(true)
    expect(Pane.isPaneSource(Fixtures.sourceAt('a', { isInPane: false }))).toBe(false)
  })

  test('a disabled source is never in the pane', () => {
    expect(Pane.isPaneSource(Fixtures.sourceAt('a', { isEnabled: false }))).toBe(false)
    expect(Pane.isPaneSource(Fixtures.sourceAt('a', { isEnabled: false, isInPane: true }))).toBe(
      false,
    )
  })
})
