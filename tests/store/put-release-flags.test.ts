import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('put-release-flags', () => {
  test('reads the store right before writing, keeping what another session cached', async () => {
    const { host, stored } = Fixtures.fakeHostOf()

    stored.set('releaseFlags', [{ releaseId: 'other', breaking: false, security: true }])

    await Store.putReleaseFlags(host, { releaseId: 'mine', breaking: true, security: false })

    expect(stored.get('releaseFlags')).toEqual([
      { releaseId: 'other', breaking: false, security: true },
      { releaseId: 'mine', breaking: true, security: false },
    ])
  })

  test('malformed stored entries are dropped', async () => {
    const { host, stored } = Fixtures.fakeHostOf({
      releaseFlags: [{ releaseId: 'x', breaking: 'yes', security: false }, 'junk', null],
    })

    await Store.putReleaseFlags(host, { releaseId: 'y', breaking: false, security: false })

    expect(stored.get('releaseFlags')).toEqual([
      { releaseId: 'y', breaking: false, security: false },
    ])
    expect(Store.releaseFlagEntriesOf({ not: 'a list' })).toEqual([])
    expect(
      Store.releaseFlagEntriesOf([
        { releaseId: 'a', breaking: false, security: false, malformed: 0 },
        { releaseId: 'b', breaking: false, security: false, malformed: 1.5 },
        { releaseId: 'c', breaking: false, security: true, malformed: 2 },
      ]),
    ).toEqual([{ releaseId: 'c', breaking: false, security: true, malformed: 2 }])
  })
})
