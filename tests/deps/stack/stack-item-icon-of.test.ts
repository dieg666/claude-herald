import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('stack-item-icon-of', () => {
  test('⚠ for a flagged release or a package whose other release is flagged, else 📦', () => {
    const items = Stack.stackPackageItemsOf(Fixtures.STACK_MIDDLE)
    const named = (name: string) => items.find(item => item.release.name === name)!

    expect(Stack.stackItemIconOf(Fixtures.stackItemAt('a', '1.0.0', { breaking: true }))).toBe('⚠')
    expect(Stack.stackItemIconOf(Fixtures.stackItemAt('a', '1.0.0', { security: true }))).toBe('⚠')
    expect(Stack.stackItemIconOf(named('zod'))).toBe('⚠')
    expect(Stack.stackItemIconOf(named('vite'))).toBe('📦')
    expect(Stack.stackItemIconOf(Fixtures.stackItemAt('a', '1.0.0'))).toBe('📦')
  })
})
