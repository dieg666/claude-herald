import { describe, expect, test } from 'claude-code/testing'

import type { DepsLevel, StackState } from '../../../types/index.js'
import Defaults from '../../../hooks/defaults'
import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('shown-stack-items-of', () => {
  const stateOf = (fields: Partial<StackState['settings']> = {}): StackState => ({
    root: '/repo',
    settings: { ...Defaults.DEFAULT_DEPS_SETTINGS, ...fields },
    items: Fixtures.STACK_SAMPLE,
    filter: '',
  })

  const SHOWN: Record<DepsLevel, string[]> = {
    all: ['react', 'vite', 'lodash', 'requests', 'next', 'zod'],
    'minor+': ['react', 'vite', 'requests', 'zod'],
    'major+breaking+security': ['react', 'requests', 'zod'],
    'breaking+security': ['react', 'requests'],
  }

  for (const [level, names] of Object.entries(SHOWN) as [DepsLevel, string[]][]) {
    test(`${level} shows ${names.join(', ')}`, () => {
      expect(
        Stack.shownStackItemsOf(stateOf({ showLevel: level })).map(item => item.release.name),
      ).toEqual(names)
    })
  }

  test('nothing while the stack is off, or before the project is known', () => {
    expect(Stack.shownStackItemsOf(stateOf({ isEnabled: false, showLevel: 'all' }))).toEqual([])
    expect(Stack.shownStackItemsOf({ ...stateOf({ showLevel: 'all' }), root: null })).toEqual([])
  })
})
