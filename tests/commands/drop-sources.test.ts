import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'
import Fixtures from '../fixtures'

describe('drop-sources', () => {
  test("forgets the sources' items, last errors and refresh times in state and the store", async () => {
    const { host, state, stored } = Fixtures.fakeHostOf({ refreshedAt: { a: 1, b: 2 } })

    state.items = { a: [Fixtures.itemAt('x')], b: [] }
    state.status = {
      lastRefreshAt: 5,
      isRefreshing: false,
      errors: { a: 'HTTP 500', b: 'timed out' },
      refreshedAt: { a: 1, b: 2 },
    }

    await Commands.dropSources(host, ['a'])

    expect(state.items).toEqual({ b: [] })
    expect(state.status).toEqual({
      lastRefreshAt: 5,
      isRefreshing: false,
      errors: { b: 'timed out' },
      refreshedAt: { b: 2 },
    })
    expect(stored.get('refreshedAt')).toEqual({ b: 2 })
  })

  test('no source changes nothing', async () => {
    const { host, sets, state } = Fixtures.fakeHostOf()
    const before = JSON.stringify(state)

    await Commands.dropSources(host, [])

    expect([sets, JSON.stringify(state)]).toEqual([[], before])
  })
})
