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
})
