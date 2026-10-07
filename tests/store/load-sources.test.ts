import { describe, expect, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'
import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('load-sources', () => {
  test('an empty store is seeded with the factory sources, and they are saved', async () => {
    const { host, stored } = Fixtures.fakeHostOf()

    const sources = await Store.loadSources(host)

    expect(sources).toEqual([...Defaults.FACTORY_SOURCES])
    expect(stored.get('sources')).toEqual([...Defaults.FACTORY_SOURCES])
  })

  test('a stored empty list stays empty: removals are never re-seeded', async () => {
    const { host, sets } = Fixtures.fakeHostOf({ sources: [] })

    expect(await Store.loadSources(host)).toEqual([])
    expect(sets).toEqual([])
  })

  test('a stored list is read back as stored, without seeding', async () => {
    const own = { ...Defaults.FACTORY_SOURCES[1], id: 'mine', isFactory: false }
    const { host, sets } = Fixtures.fakeHostOf({ sources: [own] })

    expect(await Store.loadSources(host)).toEqual([own])
    expect(sets).toEqual([])
  })

  test('a seeded list is a copy: changing it leaves the factory list alone', async () => {
    const { host } = Fixtures.fakeHostOf()

    const [first] = await Store.loadSources(host)

    if (first) {
      first.isEnabled = false
    }

    expect(Defaults.FACTORY_SOURCES[0]?.isEnabled).toBe(true)
  })
})
