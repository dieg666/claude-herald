import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('is-flagged-stack-item', () => {
  test('flagged when its release is, or when another release of its package is', () => {
    const items = Stack.stackPackageItemsOf(Fixtures.STACK_MIDDLE)
    const named = (name: string) => items.find(item => item.release.name === name)!

    expect(Stack.isFlaggedStackItem(named('zod'))).toBe(true)
    expect(Stack.isFlaggedStackItem(named('vite'))).toBe(false)
    expect(Stack.isFlaggedStackItem(named('ky'))).toBe(false)
    expect(Stack.isFlaggedStackItem(Fixtures.stackItemAt('a', '1.0.0', { security: true }))).toBe(
      true,
    )
    expect(Stack.stackItemIconOf(named('zod'))).toBe('⚠')
    expect(Stack.stackItemIconOf(named('vite'))).toBe('📦')
  })
})
