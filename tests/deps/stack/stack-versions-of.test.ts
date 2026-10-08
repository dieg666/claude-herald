import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'

describe('stack-versions-of', () => {
  test('pkg current → new, pkg → new without a version in use, pkg alone without a version', () => {
    expect(Stack.stackVersionsOf({ name: 'react', current: '18.2.0', version: '19.0.0' })).toBe(
      'react 18.2.0 → 19.0.0',
    )
    expect(Stack.stackVersionsOf({ name: 'react', version: '19.0.0' })).toBe('react → 19.0.0')
    expect(Stack.stackVersionsOf({ name: 'react', current: '18.2.0' })).toBe('react')
  })

  test('untrusted values become one line', () => {
    expect(Stack.stackVersionsOf({ name: ' a\nb ', current: '1\n0', version: '2\t0' })).toBe(
      'a b 1 0 → 2 0',
    )
  })
})
