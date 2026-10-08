import { describe, expect, test } from 'claude-code/testing'

import Refresh from '../../hooks/refresh'
import Fixtures from '../fixtures'

describe('note-refreshed', () => {
  const SOURCES = [Fixtures.sourceAt('a'), Fixtures.sourceAt('b')]

  test("stores the times merged with other sessions' and returns them all", async () => {
    const { host, stored } = Fixtures.fakeHostOf({
      sources: SOURCES,
      refreshedAt: { other: 5, a: 1 },
    })

    expect(await Refresh.noteRefreshed(host, ['a', 'b'], 9)).toEqual({ other: 5, a: 9, b: 9 })
    expect(stored.get('refreshedAt')).toEqual({ other: 5, a: 9, b: 9 })
  })

  test('a source removed meanwhile gets no time', async () => {
    const { host, stored } = Fixtures.fakeHostOf({ sources: [SOURCES[0]] })

    expect(await Refresh.noteRefreshed(host, ['a', 'gone'], 9)).toEqual({ a: 9 })
    expect(stored.get('refreshedAt')).toEqual({ a: 9 })
  })

  test('a store that throws is logged and leaves just these times', async () => {
    const { host, logs } = Fixtures.fakeHostOf({ sources: SOURCES })
    const storeGet = host.storeGet

    host.storeGet = async key => {
      if (key === 'refreshedAt') {
        throw new Error('store unavailable')
      }

      return storeGet(key)
    }

    expect(await Refresh.noteRefreshed(host, ['a'], 9)).toEqual({ a: 9 })
    expect(logs).toEqual(['herald: could not record the refresh time: store unavailable'])
  })

  test('no source records nothing', async () => {
    const { host, sets } = Fixtures.fakeHostOf({ sources: SOURCES, refreshedAt: { a: 1 } })

    expect(await Refresh.noteRefreshed(host, [], 9)).toEqual({ a: 1 })
    expect(sets).toEqual([])
  })
})
