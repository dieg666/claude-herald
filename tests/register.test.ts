import type { On } from 'claude-code'
import { describe, expect, mock, test } from 'claude-code/testing'

import Defaults from '../hooks/defaults'
import Fixtures from './fixtures'
import Go from './fixtures/deps/go'
import Feeds from './fixtures/feeds'

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

  test(
    'a store that refuses writes still hydrates settings, items and saved on a first run',
    { plugins: [Fixtures.STATE_PEEK] },
    async ($, on) => {
      const { sources, ...rest } = STORE
      const stored = new Map<string, unknown>(Object.entries(rest))

      expect(sources).toBeDefined()

      on('store.get', ($, e) => ({ value: stored.get(e.key) }))
      on('store.set', () => ({ deny: 'read-only store' }))
      on('ui.log', () => ({ value: undefined }))
      on('classic.SessionStart', () => ({}))

      await $.classic.SessionStart({ source: 'clear' })

      expect(peeked((await $.command.run(Fixtures.PEEK)).text)).toEqual({
        ...EXPECTED,
        sources: [...Defaults.FACTORY_SOURCES],
      })
    },
  )

  const FEED = Fixtures.sourceAt('feed')
  const OFF = Fixtures.sourceAt('off', { isEnabled: false })
  const PERIOD = 2 * 60_000

  const webOn = (on: On, pages: Map<string, string>) => {
    const fetched: string[] = []

    on('http.fetch', ($, e) => {
      fetched.push(e.url)

      const text = pages.get(e.url)

      return text === undefined
        ? { deny: 'offline' }
        : { value: { status: 200, ok: true, headers: {}, text } }
    })

    return fetched
  }

  test('session.start refreshes at once, then every refreshMinutes on the clock', async ($, on) => {
    const clock = mock.clock(on)
    const stored = Fixtures.storeOn(on, { sources: [FEED, OFF], settings: { refreshMinutes: 2 } })
    const fetched = webOn(on, new Map([[FEED.url, Feeds.rssWithItems(2)]]))

    on('session.start', () => ({ cwd: '/work' }))

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    expect(fetched).toEqual([FEED.url])
    expect(Object.keys(stored.get('items') as object)).toEqual(['feed'])

    await clock.advance(PERIOD - 1)

    expect(fetched.length).toBe(1)

    await clock.advance(1)

    expect(fetched).toEqual([FEED.url, FEED.url])

    await clock.advance(PERIOD)

    expect(fetched.length).toBe(3)
  })

  test('a second session.start replaces the timer instead of adding one', async ($, on) => {
    const clock = mock.clock(on)

    Fixtures.storeOn(on, { sources: [FEED], settings: { refreshMinutes: 2 } })

    const fetched = webOn(on, new Map([[FEED.url, Feeds.rssWithItems(2)]]))

    on('session.start', () => ({ cwd: '/work' }))

    await $.session.start(Fixtures.SESSION)
    await clock.settle()
    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    const before = fetched.length

    await clock.advance(PERIOD)

    expect(fetched.length).toBe(before + 1)

    await clock.advance(PERIOD)

    expect(fetched.length).toBe(before + 2)
  })

  test('new items after the first load show one grouped toast', async ($, on) => {
    const clock = mock.clock(on)
    const toasts: string[] = []
    const pages = new Map([[FEED.url, Feeds.rssWithItems(2)]])

    Fixtures.storeOn(on, { sources: [FEED], settings: { refreshMinutes: 2 } })
    webOn(on, pages)
    on('ui.toast', ($, e) => {
      toasts.push(e.text)

      return { value: undefined }
    })
    on('session.start', () => ({ cwd: '/work' }))

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    expect(toasts).toEqual([])

    pages.set(FEED.url, Feeds.rssWithItems(5))
    await clock.advance(PERIOD)

    expect(toasts).toEqual(['3 new: Item 2 & more …'])
  })

  test('network and model failures keep the items, log to debug and retry next interval', async ($, on) => {
    const clock = mock.clock(on)
    const page = Fixtures.sourceAt('page', { kind: 'page', url: 'https://example.com/news' })
    const kept = { feed: [Fixtures.itemAt('a')], page: [Fixtures.itemAt('b')] }
    const logs: string[] = []

    const stored = Fixtures.storeOn(on, {
      sources: [FEED, page],
      settings: { refreshMinutes: 2 },
      items: kept,
    })
    Fixtures.fsOn(on, {})
    Fixtures.registerOn(on)
    const fetched = webOn(on, new Map([[page.url, '<a href="/news/a">A</a>']]))

    on('model.complete', () => ({ deny: 'model unavailable' }))
    on('ui.log', ($, e) => {
      logs.push(`${e.to ?? 'transcript'}: ${e.text}`)

      return { value: undefined }
    })
    on('session.start', () => ({ cwd: '/work' }))

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    expect(stored.get('items')).toEqual(kept)
    expect(logs.length).toBe(2)
    expect(logs.every(line => line.startsWith('debug: news: '))).toBe(true)

    await clock.advance(PERIOD)

    expect(fetched.length).toBe(4)
    expect(stored.get('items')).toEqual(kept)
  })

  test('a fetch that never answers times out, skipping ticks meanwhile, then refreshes again', async ($, on) => {
    const clock = mock.clock(on)
    const logs: string[] = []
    const fetched: string[] = []
    let isHung = true

    const stored = Fixtures.storeOn(on, { sources: [FEED], settings: { refreshMinutes: 1 } })
    Fixtures.fsOn(on, {})
    Fixtures.registerOn(on)

    on('http.fetch', async ($, e) => {
      fetched.push(e.url)

      if (isHung) {
        await clock.sleep(24 * 60 * 60_000)
      }

      return { value: { status: 200, ok: true, headers: {}, text: Feeds.rssWithItems(2) } }
    })
    on('ui.log', ($, e) => {
      logs.push(e.text)

      return { value: undefined }
    })
    on('session.start', () => ({ cwd: '/work' }))

    await $.session.start(Fixtures.SESSION)
    await clock.settle()
    await clock.advance(60_000)

    expect(fetched.length).toBe(1)

    isHung = false
    await clock.advance(30_000)

    expect(logs).toEqual(['news: feed: timed out'])

    await clock.advance(30_000)

    expect(fetched.length).toBe(2)
    expect(Object.keys(stored.get('items') as object)).toEqual(['feed'])
  })
  test(
    'a first load makes no summary call; a later run with one new item makes exactly one, cached and in state',
    { plugins: [Fixtures.STATE_PEEK] },
    async ($, on) => {
      const clock = mock.clock(on)
      const pages = new Map([[FEED.url, Feeds.rssWithItems(2)]])
      const stored = Fixtures.storeOn(on, { sources: [FEED], settings: { refreshMinutes: 2 } })
      const asked: string[] = []
      const NEW = 'feed:https://example.com/2'

      webOn(on, pages)
      on('ui.toast', () => ({ value: undefined }))
      on('model.complete', ($, e) => {
        asked.push(e.prompt)

        return { value: Fixtures.answerOf('One line.\nAnother line.') }
      })
      on('session.start', () => ({ cwd: '/work' }))

      await $.session.start(Fixtures.SESSION)
      await clock.settle()

      expect(asked).toEqual([])

      pages.set(FEED.url, Feeds.rssWithItems(3))
      await clock.advance(PERIOD)

      expect(asked.length).toBe(1)
      expect(asked[0]).toContain('Title: Item 2 & more')
      expect(stored.get('summaries')).toEqual([
        { itemId: NEW, lang: 'feed', kind: 'short', text: 'One line. Another line.' },
      ])
      expect(peeked((await $.command.run(Fixtures.PEEK)).text)).toMatchObject({
        summaries: { [NEW]: 'One line. Another line.' },
      })

      await clock.advance(PERIOD)

      expect(asked.length).toBe(1)
    },
  )

  test(
    'summary requests for new items run at most two at a time',
    { timeoutMs: 20_000 },
    async ($, on) => {
      const clock = mock.clock(on)
      const pages = new Map([[FEED.url, Feeds.rssWithItems(1)]])
      const stored = Fixtures.storeOn(on, { sources: [FEED], settings: { refreshMinutes: 2 } })
      let calls = 0
      let inFlight = 0
      let most = 0

      webOn(on, pages)
      on('ui.toast', () => ({ value: undefined }))
      on('model.complete', async () => {
        calls += 1
        inFlight += 1
        most = Math.max(most, inFlight)
        await clock.sleep(1000)
        inFlight -= 1

        return { value: Fixtures.answerOf('Summary.') }
      })
      on('session.start', () => ({ cwd: '/work' }))

      await $.session.start(Fixtures.SESSION)
      await clock.settle()

      pages.set(FEED.url, Feeds.rssWithItems(6))
      await clock.advance(PERIOD)

      expect([calls, inFlight]).toEqual([2, 2])

      await clock.advance(1000)

      expect([calls, inFlight]).toEqual([4, 2])

      await clock.advance(1000)

      expect([calls, inFlight]).toEqual([5, 1])

      await clock.advance(1000)

      expect(inFlight).toBe(0)
      expect(most).toBe(2)
      expect((stored.get('summaries') as unknown[]).length).toBe(5)
    },
  )

  const PROJECT = { '.git': { isDir: true as const }, 'go.mod': Go.K8S_GO_MOD }

  test('session.start detects the stack off its dispatch, once the clock ticks', async ($, on) => {
    const clock = mock.clock(on)
    const stored = Fixtures.storeOn(on, { sources: [] })
    const fs = Fixtures.fsOn(on, PROJECT)

    on('session.start', () => ({ cwd: '/repo' }))

    await $.session.start(Fixtures.SESSION)

    expect(stored.get('deps')).toBeUndefined()
    expect(fs.lists).toEqual([])

    await clock.settle()

    expect(
      Fixtures.depNamed(Fixtures.depsAt(stored, '/repo'), 'github.com/spf13/cobra'),
    ).toMatchObject({
      versionInUse: 'v1.10.2',
    })
  })

  test('without a session.start, time passing never detects', async ($, on) => {
    const clock = mock.clock(on)
    const stored = Fixtures.storeOn(on, { sources: [] })
    const fs = Fixtures.fsOn(on, PROJECT)

    on('classic.SessionStart', () => ({}))

    await $.classic.SessionStart({ source: 'clear' })
    await clock.advance(60 * 60 * 1000)

    expect(fs.lists).toEqual([])
    expect(stored.get('deps')).toBeUndefined()
  })

  test('after the start detection, time passing alone never detects again', async ($, on) => {
    const clock = mock.clock(on)

    Fixtures.storeOn(on, { sources: [] })

    const fs = Fixtures.fsOn(on, PROJECT)

    on('session.start', () => ({ cwd: '/repo' }))

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    const lists = fs.lists.length
    const reads = fs.reads.length

    await clock.advance(60 * 60 * 1000)

    expect(lists > 0).toBe(true)
    expect(fs.lists.length).toBe(lists)
    expect(fs.reads.length).toBe(reads)
  })

  test('a project the engine cannot list still starts the session, with debug lines only', async ($, on) => {
    const clock = mock.clock(on)
    const logs: string[] = []

    Fixtures.storeOn(on, { sources: [] })
    on('session.root', () => ({ value: '/repo' }))
    Fixtures.registerOn(on)
    on('fs.list', () => ({ deny: 'not allowed' }))
    on('ui.log', ($, e) => {
      logs.push(`${e.to ?? 'transcript'}: ${e.text}`)

      return { value: undefined }
    })
    on('session.start', () => ({ cwd: '/repo' }))

    expect(await $.session.start(Fixtures.SESSION)).toEqual({ cwd: '/repo' })
    await clock.settle()

    expect(logs.length > 0).toBe(true)
    expect(logs.every(line => line.startsWith('debug: news: deps:'))).toBe(true)
  })

  test('session.start registers /news to run at once, with a description and a hint', async ($, on) => {
    mock.clock(on)
    Fixtures.storeOn(on, { sources: [] })

    const registered = Fixtures.registerOn(on)

    on('session.start', () => ({ cwd: '/work' }))

    await $.session.start(Fixtures.SESSION)

    expect(registered).toEqual([
      {
        name: 'news',
        description: expect.any(String),
        argumentHint: expect.any(String),
        immediate: true,
      },
    ])
    expect(registered[0]?.description).not.toBe('')
  })

  test('a refused registration is logged and the session still starts', async ($, on) => {
    mock.clock(on)
    Fixtures.storeOn(on, { sources: [] })

    const logs = Fixtures.logsOn(on)

    on('command.register', () => ({ deny: 'name taken' }))
    on('session.start', () => ({ cwd: '/work' }))

    expect(await $.session.start(Fixtures.SESSION)).toEqual({ cwd: '/work' })
    expect(logs).toEqual([expect.stringMatching(/^debug: news: could not register \/news: /)])
  })

  test('/news interval restarts the refresh timer once, at the new interval', async ($, on) => {
    const clock = mock.clock(on)
    const stored = Fixtures.storeOn(on, { sources: [FEED], settings: { refreshMinutes: 5 } })
    const fetched = webOn(on, new Map([[FEED.url, Feeds.rssWithItems(2)]]))

    Fixtures.registerOn(on)
    on('session.start', () => ({ cwd: '/work' }))

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    expect(fetched.length).toBe(1)

    const { text } = await $.command.run(Fixtures.newsOf('interval 2'))

    await clock.settle()

    expect(text).toMatch(/2 minutes/)
    expect(stored.get('settings')).toMatchObject({ refreshMinutes: 2 })
    expect(fetched.length).toBe(2)

    await clock.advance(2 * 60_000)

    expect(fetched.length).toBe(3)

    await clock.advance(2 * 60_000)

    expect(fetched.length).toBe(4)

    // The old 5-minute timer would fire here.
    await clock.advance(60_000)

    expect(fetched.length).toBe(4)
  })

  test('a refused /news interval leaves the timer alone', async ($, on) => {
    const clock = mock.clock(on)
    const stored = Fixtures.storeOn(on, { sources: [FEED], settings: { refreshMinutes: 5 } })
    const fetched = webOn(on, new Map([[FEED.url, Feeds.rssWithItems(2)]]))

    Fixtures.registerOn(on)
    on('session.start', () => ({ cwd: '/work' }))

    await $.session.start(Fixtures.SESSION)
    await clock.settle()
    await $.command.run(Fixtures.newsOf('interval 0'))
    await clock.settle()

    expect(fetched.length).toBe(1)
    expect(stored.get('settings')).toEqual({ refreshMinutes: 5 })

    await clock.advance(5 * 60_000)

    expect(fetched.length).toBe(2)
  })
})
