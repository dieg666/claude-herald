import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'

describe('selected-style-of', () => {
  test('the selected row draws its text in the inverse text color and any other row keeps its own', () => {
    expect(Band.selectedStyleOf(true)).toEqual({ color: 'inverseText' })
    expect(Band.selectedStyleOf(false)).toEqual({})
  })
})
