import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('hydrate-stack', () => {
  test('copies the last project looked at back into state, and does nothing before one was', async () => {
    const { host, state, fetched } = Fixtures.fakeHostOf(
      Fixtures.stackStoreOf(Fixtures.STACK_SAMPLE, { showLevel: 'all' }),
    )
    const loop = Stack.stackLoopOf()

    await Stack.hydrateStack(host, loop)

    expect(state.stack).toMatchObject({ root: null, items: [] })

    loop.root = '/repo'
    await Stack.hydrateStack(host, loop)

    expect(state.stack).toMatchObject({ root: '/repo', items: Fixtures.STACK_SAMPLE })
    expect(fetched).toEqual([])
  })
})
