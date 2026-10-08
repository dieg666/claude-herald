import { describe, expect, test } from 'claude-code/testing'

import type { DepsToastLevel, StackRelease } from '../../../types/index.js'
import Stack from '../../../hooks/deps/stack'

describe('is-at-level', () => {
  type Kind = Pick<StackRelease, 'level' | 'isPrerelease' | 'breaking' | 'security'>

  const plain = (level: StackRelease['level']): Kind => ({
    level,
    isPrerelease: false,
    breaking: false,
    security: false,
  })

  const KINDS: Record<string, Kind> = {
    patch: plain('patch'),
    minor: plain('minor'),
    major: plain('major'),
    unknown: plain('unknown'),
    'breaking patch': { ...plain('patch'), breaking: true },
    'security patch': { ...plain('patch'), security: true },
    'major pre-release': { ...plain('major'), isPrerelease: true },
    'security pre-release': { ...plain('patch'), isPrerelease: true, security: true },
  }

  // Which kinds pass each level: every level holds the next one, `off` holds nothing.
  const TABLE: Record<DepsToastLevel, string[]> = {
    all: Object.keys(KINDS),
    'minor+': ['minor', 'major', 'unknown', 'breaking patch', 'security patch'],
    'major+breaking+security': ['major', 'breaking patch', 'security patch'],
    'breaking+security': ['breaking patch', 'security patch'],
    off: [],
  }

  for (const [level, passing] of Object.entries(TABLE) as [DepsToastLevel, string[]][]) {
    test(`${level} passes exactly: ${passing.join(', ') || 'nothing'}`, () => {
      expect(
        Object.entries(KINDS)
          .filter(([, kind]) => Stack.isAtLevel(kind, level))
          .map(([name]) => name),
      ).toEqual(passing)
    })
  }

  test('a 0.x minor bump, classified major, passes major+breaking+security but not breaking+security', () => {
    const zeroMinor = plain('major')

    expect(Stack.isAtLevel(zeroMinor, 'major+breaking+security')).toBe(true)
    expect(Stack.isAtLevel(zeroMinor, 'breaking+security')).toBe(false)
  })
})
