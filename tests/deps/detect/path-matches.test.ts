import { describe, expect, test } from 'claude-code/testing'

import Detect from '../../../hooks/deps/detect'

describe('path-matches', () => {
  test('* and ? stay in one segment; ** spans any number', () => {
    expect(Detect.pathMatches(['packages', 'a'], ['packages', '*'])).toBe(true)
    expect(Detect.pathMatches(['packages', 'a', 'b'], ['packages', '*'])).toBe(false)
    expect(Detect.pathMatches(['apps', 'web', 'e2e'], ['**', 'e2e'])).toBe(true)
    expect(Detect.pathMatches(['e2e'], ['**', 'e2e'])).toBe(true)
    expect(Detect.pathMatches(['template-react'], ['template-?eact'])).toBe(true)
    expect(Detect.pathMatches(['a.b'], ['a?c'])).toBe(false)
  })
})
