import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'

describe('stack-icon-of', () => {
  test('⚠ for a breaking or security release, 📦 for any other', () => {
    expect(Stack.stackIconOf({ breaking: true, security: false })).toBe('⚠')
    expect(Stack.stackIconOf({ breaking: false, security: true })).toBe('⚠')
    expect(Stack.stackIconOf({ breaking: false, security: false })).toBe('📦')
  })
})
