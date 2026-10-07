import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('mark-seen', () => {
  test('a source never loaded has no entry; marking creates one, even empty', async () => {
    const { host } = Fixtures.fakeHostOf()

    expect((await Store.loadSeen(host)).hn).toBeUndefined()

    await Store.markSeen(host, 'hn', [])

    expect((await Store.loadSeen(host)).hn).toEqual([])
  })

  test('adds new ids first, once each, keeping other sources', async () => {
    const { host } = Fixtures.fakeHostOf({ seen: { hn: ['b', 'a'], gh: ['x'] } })

    expect(await Store.markSeen(host, 'hn', ['c', 'b'])).toEqual(['c', 'b', 'a'])
    expect(await Store.loadSeen(host)).toEqual({ hn: ['c', 'b', 'a'], gh: ['x'] })
  })

  test('caps each source, dropping the oldest ids', async () => {
    const old = Array.from({ length: Store.SEEN_PER_SOURCE }, (_, index) => `old${index}`)
    const { host } = Fixtures.fakeHostOf({ seen: { hn: old } })

    const seen = await Store.markSeen(host, 'hn', ['new'])

    expect(seen.length).toBe(Store.SEEN_PER_SOURCE)
    expect(seen[0]).toBe('new')
    expect(seen).not.toContain(`old${Store.SEEN_PER_SOURCE - 1}`)
  })
})
