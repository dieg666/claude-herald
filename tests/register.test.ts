import { describe, expect, test } from 'claude-code/testing'

import Defaults from '../hooks/defaults'
import Fixtures from './fixtures'

describe('register', () => {
  const OWN_SOURCE = { ...Defaults.FACTORY_SOURCES[6], id: 'own', isFactory: false }

  const STORE = {
    sources: [OWN_SOURCE],
    settings: { lang: 'es', rotateSeconds: 40 },
    items: { own: [Fixtures.itemAt('a')] },
    saved: [{ ...Fixtures.itemAt('s'), savedAt: 9 }],
    summaries: [{ itemId: 'src:a', lang: 'es', kind: 'short', text: 'corto' }],
  }

  const EXPECTED = {
    sources: [OWN_SOURCE],
    settings: { ...Defaults.DEFAULT_SETTINGS, lang: 'es', rotateSeconds: 40 },
    items: { own: [Fixtures.itemAt('a')] },
    saved: [{ ...Fixtures.itemAt('s'), savedAt: 9 }],
    summaries: { 'src:a': 'corto' },
  }

  const UNWRITTEN = { sources: null, settings: null, items: null, saved: null, summaries: null }

  const peeked = (text: string | undefined): unknown => JSON.parse(text ?? 'null')

  test(
    'session.start copies the store into state',
    { plugins: [Fixtures.STATE_PEEK] },
    async ($, on) => {
      Fixtures.storeOn(on, STORE)
      on('session.start', () => ({ cwd: '/work' }))

      await $.session.start(Fixtures.SESSION)

      expect(peeked((await $.command.run(Fixtures.PEEK)).text)).toEqual(EXPECTED)
    },
  )

  test(
    'session.start on an empty store seeds the factory sources',
    { plugins: [Fixtures.STATE_PEEK] },
    async ($, on) => {
      const stored = Fixtures.storeOn(on)
      on('session.start', () => ({ cwd: '/work' }))

      await $.session.start(Fixtures.SESSION)

      expect(peeked((await $.command.run(Fixtures.PEEK)).text)).toMatchObject({
        sources: [...Defaults.FACTORY_SOURCES],
        settings: Defaults.DEFAULT_SETTINGS,
      })
      expect(stored.get('sources')).toEqual([...Defaults.FACTORY_SOURCES])
    },
  )

  for (const source of ['clear', 'resume', 'fork'] as const) {
    test(
      `state equals the store after classic.SessionStart ${source}, no session.start`,
      { plugins: [Fixtures.STATE_PEEK] },
      async ($, on) => {
        Fixtures.storeOn(on, STORE)
        on('classic.SessionStart', () => ({}))

        await $.classic.SessionStart({ source })

        expect(peeked((await $.command.run(Fixtures.PEEK)).text)).toEqual(EXPECTED)
      },
    )
  }

  for (const source of ['startup', 'compact'] as const) {
    test(
      `classic.SessionStart ${source} leaves state alone`,
      { plugins: [Fixtures.STATE_PEEK] },
      async ($, on) => {
        const stored = Fixtures.storeOn(on, STORE)
        on('classic.SessionStart', () => ({}))

        await $.classic.SessionStart({ source })

        expect(peeked((await $.command.run(Fixtures.PEEK)).text)).toEqual(UNWRITTEN)
        expect(stored.get('sources')).toEqual(STORE.sources)
      },
    )
  }

  test(
    'a store that fails leaves the session starting, with one debug line',
    { plugins: [Fixtures.STATE_PEEK] },
    async ($, on) => {
      const logs: string[] = []

      on('store.get', () => ({ deny: 'store unavailable' }))
      on('ui.log', ($, e) => {
        logs.push(`${e.to ?? 'transcript'}: ${e.text}`)

        return { value: undefined }
      })
      on('classic.SessionStart', () => ({}))

      expect(await $.classic.SessionStart({ source: 'clear' })).toEqual({})
      expect(logs.length).toBe(1)
      expect(logs[0]).toMatch(/^debug: news: could not load the store/)
      expect(peeked((await $.command.run(Fixtures.PEEK)).text)).toEqual(UNWRITTEN)
    },
  )

  test(
    "user language summaries come from Claude Code's language setting",
    { plugins: [Fixtures.STATE_PEEK] },
    async ($, on) => {
      Fixtures.storeOn(on, {
        ...STORE,
        settings: { lang: 'user' },
        summaries: [
          { itemId: 'src:a', lang: 'es', kind: 'short', text: 'corto' },
          { itemId: 'src:a', lang: 'japanese', kind: 'short', text: 'mijikai' },
        ],
      })
      on('settings.read', () => ({ value: { language: 'japanese' } }))
      on('classic.SessionStart', () => ({}))

      await $.classic.SessionStart({ source: 'clear' })

      expect(peeked((await $.command.run(Fixtures.PEEK)).text)).toMatchObject({
        summaries: { 'src:a': 'mijikai' },
      })
    },
  )
})
