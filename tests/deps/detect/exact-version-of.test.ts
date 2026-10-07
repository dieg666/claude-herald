import { describe, expect, test } from 'claude-code/testing'

import Detect from '../../../hooks/deps/detect'

describe('exact-version-of', () => {
  test('a plain or `=` pinned version is exact', () => {
    expect(Detect.exactVersionOf('1.2.3')).toBe('1.2.3')
    expect(Detect.exactVersionOf('==2.50.0')).toBe('2.50.0')
    expect(Detect.exactVersionOf('= 0.1.12')).toBe('0.1.12')
    expect(Detect.exactVersionOf('v1.2.3-beta.1')).toBe('v1.2.3-beta.1')
    expect(Detect.exactVersionOf('5.0.1.670')).toBe('5.0.1.670')
  })

  test('ranges, wildcards and empty requirements are not', () => {
    for (const range of ['^1.2.3', '~1.2', '>=1,<2', '1.2.x', '1.*', '*', '', undefined]) {
      expect(Detect.exactVersionOf(range)).toBeUndefined()
    }
  })
})
