import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'
import Fixtures from '../fixtures'

describe('newest-item-of', () => {
  const idsOf = (sourceId: 'code' | 'sdk' | 'mcp' | 'py') =>
    Band.newestItemOf(Fixtures.RELEASE_BAND.items[sourceId])?.id

  test('the newest by date, wherever it is stored', () => {
    expect(idsOf('code')).toBe('code:v2.1.294')
  })

  test('the first stored of those tied on the newest date', () => {
    expect(idsOf('sdk')).toBe('sdk:v0.3.294')
    expect(Band.newestItemOf([...Fixtures.RELEASE_BAND.items.sdk].reverse().slice(1))?.id).toBe(
      'sdk:v0.3.293',
    )
  })

  test('an undated or unparsable item loses to any dated one; the first stored when none is dated', () => {
    expect(idsOf('mcp')).toBe('mcp:v1.2.0')
    expect(idsOf('py')).toBe('py:v1.0.1')
    expect(
      Band.newestItemOf([
        { ...Fixtures.itemAt('x'), publishedAt: 'someday' },
        Fixtures.itemAt('y', '2020-01-01T00:00:00Z'),
      ])?.id,
    ).toBe('src:y')
  })

  test('nothing from no items', () => {
    expect(Band.newestItemOf([])).toBeUndefined()
  })
})
