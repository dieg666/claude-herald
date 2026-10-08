import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'

describe('refreshed-at-of', () => {
  test('keeps finite numbers by source id and drops anything else', () => {
    expect(Store.refreshedAtOf({ a: 1, b: 'x', c: Number.NaN, d: null, e: 0 })).toEqual({
      a: 1,
      e: 0,
    })
    expect(Store.refreshedAtOf(undefined)).toEqual({})
    expect(Store.refreshedAtOf([1, 2])).toEqual({})
  })
})
