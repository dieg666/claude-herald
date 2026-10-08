import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'

describe('selected-fill-of', () => {
  test('the selected row is filled with the text color and any other row is not', () => {
    expect(Band.selectedFillOf(true)).toEqual({ backgroundColor: 'text' })
    expect(Band.selectedFillOf(false)).toEqual({})
  })
})
