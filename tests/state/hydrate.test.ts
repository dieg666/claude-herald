import { describe, expect, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'
import State from '../../hooks/state'
import Summaries from '../../hooks/summaries'
import Fixtures from '../fixtures'

describe('hydrate', () => {
  const OWN_SOURCE = { ...Defaults.FACTORY_SOURCES[1], id: 'own', isFactory: false }

  const STORE = {
    sources: [OWN_SOURCE],
    settings: { lang: 'es' },
    items: { own: [Fixtures.itemAt('a')] },
    saved: [{ ...Fixtures.itemAt('s'), savedAt: 9 }],
    summaries: [
      {
        itemId: 'src:a',
        lang: 'es',
        kind: 'short',
        version: Summaries.SUMMARY_PROMPT_VERSION,
        text: 'corto',
      },
      {
        itemId: 'src:a',
        lang: 'es',
        kind: 'long',
        version: Summaries.SUMMARY_PROMPT_VERSION,
        text: 'largo',
      },
      {
        itemId: 'src:a',
        lang: 'en',
        kind: 'short',
        version: Summaries.SUMMARY_PROMPT_VERSION,
        text: 'short',
      },
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

  test('copies the read and viewed ids into state; a store from before them gives none', async () => {
    const { host, state } = Fixtures.fakeHostOf({
      ...STORE,
      read: { own: ['own:a'] },
      viewed: { own: ['own:a', 'own:b'], gone: [] },
    })

    await State.hydrate(host)

    expect(state.read).toEqual({ own: ['own:a'] })
    expect(state.viewed).toEqual({ own: ['own:a', 'own:b'], gone: [] })

    const before = Fixtures.fakeHostOf(STORE)

    await before.host.state.read.update(() => ({ own: ['stale'] }))
    await State.hydrate(before.host)

    expect(before.state.read).toEqual({})
    expect(before.state.viewed).toEqual({})
  })

  test('stored copies of one story fold onto the id the summary is cached under', async () => {
    const guid = {
      ...Fixtures.itemAt('story'),
      id: 'own:https://news.ycombinator.com/item?id=1',
      sourceId: 'own',
    }

    const dup = { ...guid, id: 'own:https://example.com/story', text: 'Comments' }

    const { host, state } = Fixtures.fakeHostOf({
      ...STORE,
      items: { own: [dup, guid] },
      summaries: [
        {
          itemId: guid.id,
          lang: 'es',
          kind: 'short',
          version: Summaries.SUMMARY_PROMPT_VERSION,
          text: 'corto',
        },
      ],
    })

    await State.hydrate(host)

    expect(state.items).toEqual({ own: [guid] })
    expect(state.summaries).toEqual({ [guid.id]: 'corto' })
  })

  test('distinct entries that share one address are all kept', async () => {
    const entries = ['a', 'b', 'c'].map(key => ({
      ...Fixtures.itemAt(key),
      id: `own:${key}`,
      sourceId: 'own',
      url: 'https://example.com/changelog',
    }))

    const { host, state } = Fixtures.fakeHostOf({ ...STORE, items: { own: entries } })

    await State.hydrate(host)

    expect(state.items).toEqual({ own: entries })
  })

  test('a short summary an older prompt version wrote stays out of state', async () => {
    const { host, state } = Fixtures.fakeHostOf({
      ...STORE,
      summaries: [
        { itemId: 'src:a', lang: 'es', kind: 'short', text: 'según el título' },
        { itemId: 'src:b', lang: 'es', kind: 'short', version: 0, text: 'viejo' },
      ],
    })

    await State.hydrate(host)

    expect(state.summaries).toEqual({})
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
    expect(logs).toEqual(['herald: could not load the store: store unavailable: sources'])
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
    expect(logs).toEqual(['herald: could not save the factory sources: read-only store'])
  })
})
