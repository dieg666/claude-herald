import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'

describe('is-flagged-release', () => {
  test('a breaking or security release is flagged, any other is not, and the flagged ones draw ⚠', () => {
    const releases = [
      { breaking: true, security: false },
      { breaking: false, security: true },
      { breaking: true, security: true },
      { breaking: false, security: false },
    ]

    expect(releases.map(Stack.isFlaggedRelease)).toEqual([true, true, true, false])
    expect(releases.map(release => Stack.stackIconOf(release) === '⚠')).toEqual(
      releases.map(Stack.isFlaggedRelease),
    )
  })
})
