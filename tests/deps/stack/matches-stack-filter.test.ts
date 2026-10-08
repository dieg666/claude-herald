import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('matches-stack-filter', () => {
  const [react, , , requests] = Fixtures.STACK_SAMPLE

  test('a blank filter matches everything', () => {
    expect(Stack.matchesStackFilter(react!, '')).toBe(true)
    expect(Stack.matchesStackFilter(react!, '   ')).toBe(true)
  })

  test('every word must be in the name, the ecosystem, the level or a flag, ignoring case', () => {
    expect(Stack.matchesStackFilter(react!, 'REA')).toBe(true)
    expect(Stack.matchesStackFilter(react!, 'npm breaking')).toBe(true)
    expect(Stack.matchesStackFilter(react!, 'npm security')).toBe(false)
    expect(Stack.matchesStackFilter(requests!, 'pypi security')).toBe(true)
    expect(Stack.matchesStackFilter(requests!, 'major')).toBe(false)
  })
})
