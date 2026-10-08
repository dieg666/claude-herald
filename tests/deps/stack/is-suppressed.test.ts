import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'

describe('is-suppressed', () => {
  test('a failure is left alone for the window, from the time it failed', () => {
    const loop = Stack.stackLoopOf()
    const window = Stack.STACK_LIMITS.failureWindowMs

    loop.failedAt.set('flag:x', 1000)

    expect(Stack.isSuppressed(loop, 'flag:x', 1000)).toBe(true)
    expect(Stack.isSuppressed(loop, 'flag:x', 1000 + window - 1)).toBe(true)
    expect(Stack.isSuppressed(loop, 'flag:x', 1000 + window)).toBe(false)
    expect(Stack.isSuppressed(loop, 'flag:x', 999)).toBe(false)
    expect(Stack.isSuppressed(loop, 'flag:y', 1000)).toBe(false)
  })
})
