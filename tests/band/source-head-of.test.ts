import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'
import Fixtures from '../fixtures'

describe('source-head-of', () => {
  test("a news item: its source's label in the twelve-cell column and its gap, the title as stored fitted to the room", () => {
    const [item] = Fixtures.datedItemsOf('a', 1)

    expect(Band.sourceHeadOf(item!, Fixtures.sourceAt('a', { name: 'Alpha' }), 10)).toEqual({
      source: 'Alpha',
      sourceGap: ' '.repeat(9),
      title: 'a 1',
    })
    expect(
      Band.sourceHeadOf(
        { ...item!, title: 'x'.repeat(20) },
        Fixtures.sourceAt('a', { name: 'A much longer name' }),
        10,
      ),
    ).toEqual({ source: 'A much long…', sourceGap: '  ', title: `${'x'.repeat(9)}…` })
  })

  test('a release source or a version-only title is marked a release; a gone source leaves the column blank', () => {
    const [item] = Fixtures.datedItemsOf('a', 1)
    const feed = Fixtures.sourceAt('a', { url: 'https://github.com/o/r/releases.atom' })

    expect(Band.sourceHeadOf(item!, feed, 40).isRelease).toBe(true)
    expect(Band.sourceHeadOf({ ...item!, title: 'v1.2.3' }, undefined, 40)).toEqual({
      source: '',
      sourceGap: ' '.repeat(14),
      isRelease: true,
      title: 'v1.2.3',
    })
  })

  test("a stack release: its glyph, the package in the column's nine cells, `current → new` as the headline", () => {
    const [react] = Fixtures.STACK_SAMPLE

    expect(Band.sourceHeadOf(react!, undefined, 40)).toEqual({
      icon: '⚠',
      source: 'react',
      sourceGap: ' '.repeat(6),
      isRelease: true,
      title: '18.2.0 → 19.0.0 · React 19',
    })
  })
})
