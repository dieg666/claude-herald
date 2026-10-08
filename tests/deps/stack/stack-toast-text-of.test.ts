import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Refresh from '../../../hooks/refresh'
import Fixtures from '../../fixtures'

describe('stack-toast-text-of', () => {
  const [react, vite, , requests] = Fixtures.STACK_SAMPLE

  test('none is empty', () => {
    expect(Stack.stackToastTextOf([])).toBe('')
  })

  test('one, two and more releases are grouped as the sources are, breaking and security marked ⚠', () => {
    expect(Stack.stackToastTextOf([react!])).toBe('1 release: react 18.2.0 → 19.0.0 ⚠')
    expect(Stack.stackToastTextOf([vite!, requests!])).toBe(
      '2 releases: vite 5.0.0 → 5.1.0, requests 2.31.0 → 2.31.1 ⚠',
    )
    expect(Stack.stackToastTextOf([react!, vite!, requests!])).toBe(
      '3 releases: react 18.2.0 → 19.0.0 ⚠ …',
    )
  })

  test('a long package name is cut at a word to the toast cap', () => {
    const long = Fixtures.stackItemAt(`${'very-long-name '.repeat(20)}pkg`, '2.0.0', {
      current: '1.0.0',
    })
    const text = Stack.stackToastTextOf([long, vite!])

    expect(text.length <= Refresh.REFRESH_LIMITS.toastChars).toBe(true)
    expect(text.startsWith('2 releases: very-long-name')).toBe(true)
    expect(text.endsWith('…')).toBe(true)
  })
})
