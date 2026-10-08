import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('matches-stack-filter', () => {
  const packages = Stack.stackPackagesOf([...Fixtures.STACK_SAMPLE, ...Fixtures.STACK_RELEASES])
  const named = (name: string) => packages.find(pkg => pkg.name === name)!
  const react = named('react')
  const requests = named('requests')

  test('a blank filter matches everything', () => {
    expect(Stack.matchesStackFilter(react, '')).toBe(true)
    expect(Stack.matchesStackFilter(react, '   ')).toBe(true)
  })

  test('every word must be in the name, the ecosystem, the level or a flag, ignoring case', () => {
    expect(Stack.matchesStackFilter(react, 'REA')).toBe(true)
    expect(Stack.matchesStackFilter(react, 'npm breaking')).toBe(true)
    expect(Stack.matchesStackFilter(react, 'npm security')).toBe(false)
    expect(Stack.matchesStackFilter(requests, 'pypi security')).toBe(true)
    expect(Stack.matchesStackFilter(requests, 'major')).toBe(false)
  })

  test('a package matches a flag any of its releases carries, and its highest level only', () => {
    const jsdom = named('jsdom')

    expect(Stack.matchesStackFilter(jsdom, 'jsdom breaking')).toBe(true)
    expect(Stack.matchesStackFilter(jsdom, 'major')).toBe(true)
    expect(Stack.matchesStackFilter(named('next'), 'pre-release')).toBe(true)
    expect(Stack.matchesStackFilter(named('@fortawesome/fontawesome-svg-core'), 'major')).toBe(
      false,
    )
  })
})
