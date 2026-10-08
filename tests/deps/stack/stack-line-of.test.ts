import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('stack-line-of', () => {
  test('pkg current → new, then the release title when it says more than the version', () => {
    const [react, vite] = Fixtures.STACK_SAMPLE

    expect(Stack.stackLineOf(react!)).toBe('react 18.2.0 → 19.0.0 · React 19')
    expect(Stack.stackLineOf(vite!)).toBe('vite 5.0.0 → 5.1.0')
    expect(Stack.stackLineOf(Fixtures.stackItemAt('a', '2.0.0', { title: '2.0.0' }))).toBe(
      'a → 2.0.0',
    )
  })

  test('a release that names no version shows the package and its title', () => {
    const item = Fixtures.stackItemAt('a', '1.0.0', { title: 'Nightly build' })
    const { version, ...release } = item.release

    expect(version).toBe('1.0.0')
    expect(Stack.stackLineOf({ ...item, release })).toBe('a · Nightly build')
  })

  test('untrusted line breaks stay on one line', () => {
    const item = Fixtures.stackItemAt('a\nb', '2.0.0', { current: '1\n0', title: 'x\ny' })

    expect(Stack.stackLineOf(item)).not.toMatch(/\n/)
  })
})
