import { describe, expect, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'
import State from '../../hooks/state'
import Fixtures from '../fixtures'

describe('hydrate', () => {
  const OWN_SOURCE = { ...Defaults.FACTORY_SOURCES[1], id: 'own', isFactory: false }

  const STORE = {
    sources: [OWN_SOURCE],
    settings: { lang: 'es' },
    items: { own: [Fixtures.itemAt('a')] },
    saved: [{ ...Fixtures.itemAt('s'), savedAt: 9 }],
    summaries: [
      { itemId: 'src:a', lang: 'es', kind: 'short', text: 'corto' },
      { itemId: 'src:a', lang: 'es', kind: 'long', text: 'largo' },
      { itemId: 'src:a', lang: 'en', kind: 'short', text: 'short' },
    ],
  }

  test('copies the store into state, settings filled and short summaries in the language', async () => {
    const { host, state } = Fixtures.fakeHostOf(STORE)

    await State.hydrate(host)

    expect(state.sources).toEqual([OWN_SOURCE])
    expect(state.settings).toEqual({ ...Defaults.DEFAULT_SETTINGS, lang: 'es' })
    expect(state.items).toEqual({ own: [Fixtures.itemAt('a')] })
    expect(state.saved).toEqual([{ ...Fixtures.itemAt('s'), savedAt: 9 }])
    expect(state.summaries).toEqual({ 'src:a': 'corto' })
  })

  test('an empty store seeds the factory sources into state and store', async () => {
    const { host, state, stored } = Fixtures.fakeHostOf()

    await State.hydrate(host)

    expect(state.sources).toEqual([...Defaults.FACTORY_SOURCES])
    expect(stored.get('sources')).toEqual([...Defaults.FACTORY_SOURCES])
    expect(state.settings).toEqual(Defaults.DEFAULT_SETTINGS)
  })

  test('the user language picks the summaries when lang is user', async () => {
    const { host, state } = Fixtures.fakeHostOf({ ...STORE, settings: { lang: 'user' } }, 'en')

    await State.hydrate(host)

    expect(state.summaries).toEqual({ 'src:a': 'short' })
  })

  test('leaves the band, pane and status alone', async () => {
    const { host, state } = Fixtures.fakeHostOf(STORE)

    await host.state.band.update(() => ({ offset: 3, selected: 1, isPaused: true }))
    await State.hydrate(host)

    expect(state.band).toEqual({ offset: 3, selected: 1, isPaused: true })
    expect(state.pane).toEqual(State.INITIAL_STATE.pane)
    expect(state.status).toEqual(State.INITIAL_STATE.status)
  })

  test('a failed store read writes no state, logs to debug and does not throw', async () => {
    const { host, state, logs } = Fixtures.fakeHostOf(STORE)

    host.storeGet = async key => {
      throw new Error(`store unavailable: ${key}`)
    }

    expect(await State.hydrate(host)).toBeUndefined()
    expect(state.sources).toEqual([])
    expect(logs).toEqual(['news: could not load the store: store unavailable: sources'])
  })

  test('a store that reads but refuses writes still fills state on a first run', async () => {
    const { sources, ...rest } = STORE
    const { host, state, logs } = Fixtures.fakeHostOf(rest)

    expect(sources).toBeDefined()

    host.storeSet = async () => {
      throw new Error('read-only store')
    }

    expect(await State.hydrate(host)).toBeDefined()
    expect(state.sources).toEqual([...Defaults.FACTORY_SOURCES])
    expect(state.settings).toEqual({ ...Defaults.DEFAULT_SETTINGS, lang: 'es' })
    expect(state.items).toEqual({ own: [Fixtures.itemAt('a')] })
    expect(state.saved).toEqual([{ ...Fixtures.itemAt('s'), savedAt: 9 }])
    expect(state.summaries).toEqual({ 'src:a': 'corto' })
    expect(logs).toEqual(['news: could not save the factory sources: read-only store'])
  })
})
