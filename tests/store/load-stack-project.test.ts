import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('load-stack-project', () => {
  test("one project's record as stored; an empty one for a project never refreshed or a store that holds none", async () => {
    const { stack } = Fixtures.stackStoreOf(Fixtures.STACK_SAMPLE)

    expect(await Store.loadStackProject(Fixtures.fakeHostOf({ stack }).host, '/repo')).toEqual(
      stack['/repo'],
    )
    expect(await Store.loadStackProject(Fixtures.fakeHostOf({ stack }).host, '/other')).toEqual({
      deps: {},
      refreshedAt: 0,
    })
    expect(
      await Store.loadStackProject(Fixtures.fakeHostOf({ stack: [1] }).host, 'toString'),
    ).toEqual({ deps: {}, refreshedAt: 0 })
  })
})
