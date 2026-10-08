import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('stack-summary-of', () => {
  test('packages behind, then those with a security and a breaking release; zero counts left out', () => {
    const packagesOf = (items: Parameters<typeof Stack.stackPackagesOf>[0]) =>
      Stack.stackPackagesOf(items)

    expect(Stack.stackSummaryOf(packagesOf(Fixtures.STACK_RELEASES))).toBe(
      '7 packages behind · 2 security · 1 breaking',
    )
    expect(Stack.stackSummaryOf(packagesOf([Fixtures.stackItemAt('a', '1.0.0')]))).toBe(
      '1 package behind',
    )
    expect(
      Stack.stackSummaryOf(packagesOf([Fixtures.stackItemAt('a', '1.0.0', { breaking: true })])),
    ).toBe('1 package behind · 1 breaking')
    expect(Stack.stackSummaryOf([])).toBe('')
  })
})
