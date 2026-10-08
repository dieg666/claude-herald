import { describe, expect, test } from 'claude-code/testing'

import Classify from '../../../hooks/deps/classify'
import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('with-cached-flags', () => {
  const releases = Classify.classifyReleases(Fixtures.depAt('acme', { versionInUse: '1.0.0' }), [
    Fixtures.releaseAt('v1.1.0', 'A breaking change.'),
    Fixtures.releaseAt('v1.2.0', 'Fixes GHSA-aaaa-bbbb-cccc.'),
    Fixtures.releaseAt('v1.3.0', 'Breaking.'),
  ])
  const [first, second, third] = releases

  test('a cached verdict replaces the keyword flags, an advisory id keeps security, a malformed or missing one changes nothing', () => {
    const flagged = Stack.withCachedFlags(releases, [
      { releaseId: first?.id ?? '', breaking: false, security: false },
      { releaseId: second?.id ?? '', breaking: true, security: false },
      { releaseId: third?.id ?? '', breaking: false, security: false, malformed: 1 },
    ])

    expect(flagged.map(release => release.flags)).toEqual([
      { breaking: false, security: false },
      { breaking: true, security: true },
      { breaking: true, security: false },
    ])
  })
})
