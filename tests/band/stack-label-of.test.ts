import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'

describe('stack-label-of', () => {
  test('a name that fits is kept whole, scoped or not', () => {
    expect(Band.stackLabelOf('react', 9)).toBe('react')
    expect(Band.stackLabelOf('@vue/core', 9)).toBe('@vue/core')
  })

  test('a scoped name that does not fit drops its scope, and is left to be cut', () => {
    expect(Band.stackLabelOf('@astrojs/node', 9)).toBe('node')
    expect(Band.stackLabelOf('@types/react-dom-extras', 9)).toBe('react-dom-extras')
  })

  test('an unscoped name that does not fit is left to be cut', () => {
    expect(Band.stackLabelOf('typescript-eslint', 9)).toBe('typescript-eslint')
  })
})
