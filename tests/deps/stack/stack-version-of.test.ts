import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('stack-version-of', () => {
  test('the version, else the title, on one line', () => {
    const item = Fixtures.stackItemAt('a', '2.0.0', { title: 'Two\npoint oh' })

    expect(Stack.stackVersionOf(item)).toBe('2.0.0')
    expect(
      Stack.stackVersionOf({ ...item, release: { ...item.release, version: undefined } }),
    ).toBe('Two point oh')
  })
})
