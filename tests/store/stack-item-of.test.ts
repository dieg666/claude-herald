import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('stack-item-of', () => {
  test('an item with a release reads back as stored; without one, or not an item, it is none', () => {
    const [react] = Fixtures.STACK_SAMPLE

    expect(Store.stackItemOf(JSON.parse(JSON.stringify(react)))).toEqual(react)
    expect(Store.stackItemOf(Fixtures.itemAt('a'))).toBeUndefined()
    expect(Store.stackItemOf({ release: react?.release })).toBeUndefined()
    expect(Store.stackItemOf(null)).toBeUndefined()
  })
})
