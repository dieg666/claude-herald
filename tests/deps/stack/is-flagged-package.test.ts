import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('is-flagged-package', () => {
  test('flagged when any release shown is breaking or security, the newest or an older one', () => {
    const flagged = Stack.stackPackagesOf(Fixtures.STACK_RELEASES).map(pkg => [
      pkg.name,
      Stack.isFlaggedPackage(pkg),
    ])

    expect(flagged).toEqual([
      ['left-pad', false],
      ['astro', false],
      ['@astrojs/node', true],
      ['jsdom', true],
      ['@fortawesome/fontawesome-svg-core', false],
      ['lodash', false],
      ['requests', true],
    ])
  })
})
