import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('stack-release-of', () => {
  const [react] = Fixtures.STACK_SAMPLE

  test('a stored release reads back as stored', () => {
    expect(Store.stackReleaseOf(JSON.parse(JSON.stringify(react?.release)))).toEqual(react?.release)
  })

  test('without its id, a known ecosystem or a name it is none; unusable fields fall back', () => {
    expect(Store.stackReleaseOf({ ...react?.release, releaseId: '' })).toBeUndefined()
    expect(Store.stackReleaseOf({ ...react?.release, ecosystem: 'cpan' })).toBeUndefined()
    expect(Store.stackReleaseOf({ ...react?.release, name: ' ' })).toBeUndefined()
    expect(Store.stackReleaseOf('release')).toBeUndefined()
    expect(
      Store.stackReleaseOf({
        releaseId: 'r',
        ecosystem: 'npm',
        name: 'a',
        current: 1,
        level: 'huge',
        breaking: 'yes',
      }),
    ).toEqual({
      releaseId: 'r',
      ecosystem: 'npm',
      name: 'a',
      level: 'unknown',
      isPrerelease: false,
      breaking: false,
      security: false,
    })
  })
})
