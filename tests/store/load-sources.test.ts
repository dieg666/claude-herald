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

  test('a stored null counts as never stored and is seeded', async () => {
    const { host, stored } = Fixtures.fakeHostOf({ sources: null })

    expect(await Store.loadSources(host)).toEqual([...Defaults.FACTORY_SOURCES])
    expect(stored.get('sources')).toEqual([...Defaults.FACTORY_SOURCES])
  })

  test('a stored value that is not a list reads as the factory sources, logged, the store untouched', async () => {
    const corrupt = { hn: 'https://hnrss.org/frontpage' }
    const { host, stored, sets, logs } = Fixtures.fakeHostOf({ sources: corrupt })

    expect(await Store.loadSources(host)).toEqual([...Defaults.FACTORY_SOURCES])
    expect(sets).toEqual([])
    expect(stored.get('sources')).toEqual(corrupt)
    expect(logs).toEqual(['herald: the stored sources are not a list; showing the factory sources'])
  })

  test('a failed seed write is logged and the factory sources still come back', async () => {
    const { host, logs } = Fixtures.fakeHostOf()

    host.storeSet = async () => {
      throw new Error('disk full')
    }

    expect(await Store.loadSources(host)).toEqual([...Defaults.FACTORY_SOURCES])
    expect(logs).toEqual(['herald: could not save the factory sources: disk full'])
  })
})
