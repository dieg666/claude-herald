import { describe, expect, test } from 'claude-code/testing'

import Detect from '../../../hooks/deps/detect'

describe('member-pattern-of', () => {
  test('relative patterns become segments, `.` and empty parts dropped', () => {
    expect(Detect.memberPatternOf('./packages/*/')).toEqual(['packages', '*'])
    expect(Detect.memberPatternOf('.')).toEqual([])
    expect(Detect.memberPatternOf('crates\\core')).toEqual(['crates', 'core'])
  })

  test('absolute, home-relative and climbing patterns are refused', () => {
    for (const pattern of ['/etc', 'C:\\x', '~/code', '../x', 'a/../../b', '']) {
      expect(Detect.memberPatternOf(pattern)).toBeUndefined()
    }
  })
})
