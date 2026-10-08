import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('mirror-stack', () => {
  test("copies a project's settings and kept releases from the store into state, writing nothing to the store", async () => {
    const { host, state, sets } = Fixtures.fakeHostOf(
      Fixtures.stackStoreOf(Fixtures.STACK_SAMPLE, { showLevel: 'all' }),
    )

    const mirrored = await Stack.mirrorStack(host, '/repo')

    expect(mirrored).toEqual(state.stack)
    expect(mirrored).toMatchObject({
      root: '/repo',
      settings: { showLevel: 'all' },
      items: Fixtures.STACK_SAMPLE,
      filter: '',
    })
    expect(sets).toEqual([])
  })

  test('a project with nothing stored mirrors as empty with default settings', async () => {
    const { host } = Fixtures.fakeHostOf()

    expect(await Stack.mirrorStack(host, '/new')).toMatchObject({
      root: '/new',
      settings: { isEnabled: true, showLevel: 'minor+' },
      items: [],
    })
  })
})
