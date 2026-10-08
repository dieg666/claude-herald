import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('add-source-ids', () => {
  test('puts the ids at the head of the source list once each, keeping the other sources', async () => {
    const { host, stored } = Fixtures.fakeHostOf({ read: { a: ['a:1'], b: ['b:1'] } })

    expect(await Store.addSourceIds(host, 'read', 'a', ['a:2', 'a:1'])).toEqual({
      a: ['a:2', 'a:1'],
      b: ['b:1'],
    })
    expect(stored.get('read')).toEqual({ a: ['a:2', 'a:1'], b: ['b:1'] })
  })

  test('keeps at most SEEN_PER_SOURCE ids, the newest', async () => {
    const old = Array.from({ length: Store.SEEN_PER_SOURCE }, (_, i) => `a:old${i}`)
    const { host, stored } = Fixtures.fakeHostOf({ viewed: { a: old } })

    await Store.addSourceIds(host, 'viewed', 'a', ['a:new'])

    const ids = (stored.get('viewed') as Record<string, string[]>).a ?? []

    expect(ids.length).toBe(Store.SEEN_PER_SOURCE)
    expect(ids[0]).toBe('a:new')
    expect(ids.at(-1)).toBe(`a:old${Store.SEEN_PER_SOURCE - 2}`)
  })

  test('reads the store right before writing, so another session writing meanwhile is kept', async () => {
    const { host, stored } = Fixtures.fakeHostOf()

    stored.set('read', { b: ['b:1'] })

    expect(await Store.addSourceIds(host, 'read', 'a', ['a:1'])).toEqual({
      a: ['a:1'],
      b: ['b:1'],
    })
  })

  test('writes nothing when the ids are already at the head', async () => {
    const { host, sets } = Fixtures.fakeHostOf({ read: { a: ['a:1', 'a:0'] } })

    expect(await Store.addSourceIds(host, 'read', 'a', ['a:1'])).toEqual({ a: ['a:1', 'a:0'] })
    expect(sets).toEqual([])
  })

  test('a first entry with no ids is written, so the source has one', async () => {
    const { host, stored } = Fixtures.fakeHostOf()

    await Store.addSourceIds(host, 'viewed', 'a', [])

    expect(stored.get('viewed')).toEqual({ a: [] })
  })
})
