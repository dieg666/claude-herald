import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('saved-of', () => {
  test("drops entries without an item's fields or a numeric save time", () => {
    expect(
      Store.savedOf([
        { ...Fixtures.itemAt('a'), savedAt: 1 },
        Fixtures.itemAt('no-time'),
        { savedAt: 2 },
        null,
      ]),
    ).toEqual([{ ...Fixtures.itemAt('a'), savedAt: 1 }])
  })

  test('not a list reads as empty', () => {
    expect(Store.savedOf(undefined)).toEqual([])
    expect(Store.savedOf({})).toEqual([])
  })

  test('a saved stack item keeps its release; a news item never gets one, nor one whose release is broken', () => {
    const [react] = Fixtures.STACK_SAMPLE
    const saved = { ...react!, savedAt: 3 }

    expect(Store.savedOf([saved])).toEqual([saved])
    expect(
      Store.savedOf([{ ...Fixtures.itemAt('a'), release: react?.release, savedAt: 1 }]),
    ).toEqual([{ ...Fixtures.itemAt('a'), savedAt: 1 }])

    const { release, ...fields } = react!

    expect(release).toBeDefined()
    expect(Store.savedOf([{ ...react!, release: { name: 'x' }, savedAt: 3 }])).toEqual([
      { ...fields, savedAt: 3 },
    ])
  })
})
