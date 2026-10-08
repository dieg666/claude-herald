import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('stack-tab-items-of', () => {
  const namesOf = (items: readonly { release: { name: string } }[]) =>
    items.map(item => item.release.name)

  test('grouped by ecosystem in a fixed order, each group in the order given', () => {
    const cargo = Fixtures.stackItemAt('serde', '2.0.0', { ecosystem: 'cargo' })
    const items = [cargo, ...Fixtures.STACK_SAMPLE]

    expect(namesOf(Stack.stackTabItemsOf(items, ''))).toEqual([
      'react',
      'vite',
      'lodash',
      'next',
      'zod',
      'requests',
      'serde',
    ])
  })

  test('only the items matching the filter', () => {
    expect(namesOf(Stack.stackTabItemsOf(Fixtures.STACK_SAMPLE, 're'))).toEqual([
      'react',
      'next',
      'requests',
    ])
  })
})
