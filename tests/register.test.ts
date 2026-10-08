import type { On } from 'claude-code'
import { describe, expect, mock, test } from 'claude-code/testing'

import Defaults from '../hooks/defaults'
import Store from '../hooks/store'
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

      Fixtures.registerOn(on)
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
    // One line per failed source; each shown item fails once at the start and again after the run.
    expect(logs.filter(line => !line.includes(' summary of ')).length).toBe(2)
    expect(logs.filter(line => line.includes('no short summary of ')).length).toBe(4)
    expect(logs.length).toBe(6)
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
    'a first load summarizes only the page the band shows; a later run with one new item makes exactly one more, cached and in state',
    { plugins: [Fixtures.STATE_PEEK] },
    async ($, on) => {
      const clock = mock.clock(on)
      const pages = new Map([[FEED.url, Feeds.rssWithItems(5)]])
      // The band keeps its first page meanwhile, so only refresh runs ask for summaries.
      const stored = Fixtures.storeOn(on, {
        sources: [FEED],
        settings: { refreshMinutes: 2, rotateSeconds: 3600 },
      })
      const asked: string[] = []
      const NEW = 'feed:https://example.com/5'
      const titlesOf = (prompts: string[]) =>
        prompts.map(prompt => /^Title: (.*)$/m.exec(prompt)?.[1])

      webOn(on, pages)
      on('ui.toast', () => ({ value: undefined }))
      on('model.complete', ($, e) => {
        asked.push(e.prompt)

        return { value: Fixtures.answerOf('One line.\nAnother line.') }
      })
      on('session.start', () => ({ cwd: '/work' }))

      await $.session.start(Fixtures.SESSION)
      await clock.settle()

      // The three items on the band's page, none of the two behind it.
      expect(titlesOf(asked).sort()).toEqual(['Item 0 & more', 'Item 1 & more', 'Item 2 & more'])

      pages.set(FEED.url, Feeds.rssWithItems(6))
      await clock.advance(PERIOD)

      expect(titlesOf(asked.slice(3))).toEqual(['Item 5 & more'])
      expect(stored.get('summaries')).toContainEqual({
        itemId: NEW,
        lang: 'feed',
        kind: 'short',
        text: 'One line. Another line.',
      })
      expect((stored.get('summaries') as unknown[]).length).toBe(4)
      expect(peeked((await $.command.run(Fixtures.PEEK)).text)).toMatchObject({
        summaries: { [NEW]: 'One line. Another line.' },
      })

      await clock.advance(PERIOD)

      expect(asked.length).toBe(4)
    },
  )

  test('a first refresh with nothing seen yet summarizes the three items the band shows, once', async ($, on) => {
    const clock = mock.clock(on)
    const asked: string[] = []

    Fixtures.storeOn(on, { sources: [FEED], settings: { refreshMinutes: 2, rotateSeconds: 3600 } })
    webOn(on, new Map([[FEED.url, Feeds.rssWithItems(7)]]))
    on('ui.render', () => Fixtures.BELOW_BAND)
    on('model.complete', ($, e) => {
      asked.push(/^Title: (.*)$/m.exec(e.prompt)?.[1] ?? '')

      return { value: Fixtures.answerOf('Short.') }
    })
    on('session.start', () => ({ cwd: '/work' }))

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    const ui = await $.ui.mount({
      plugin: 'news',
      component: 'AbovePrompt',
      props: Fixtures.BAND_PROPS,
      surface: 'terminal',
    })
    const shown = (await ui.findAll({ type: 'Link' })).map(link => link.children.join(''))

    expect(shown.length).toBe(3)
    expect([...asked].sort()).toEqual([...shown].sort())
    expect(await ui.find({ type: 'Text', text: /^…$/ })).toBeUndefined()

    await clock.advance(2 * PERIOD)

    expect(asked.length).toBe(3)
  })

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
      // The first load's one item is on the page the band shows, so it is summarized first.
      await clock.advance(1000)

      expect([calls, inFlight]).toEqual([1, 0])

      pages.set(FEED.url, Feeds.rssWithItems(6))
      await clock.advance(PERIOD - 1000)

      expect([calls, inFlight]).toEqual([3, 2])

      await clock.advance(1000)

      expect([calls, inFlight]).toEqual([5, 2])

      await clock.advance(1000)

      expect([calls, inFlight]).toEqual([6, 1])

      await clock.advance(1000)

      expect(inFlight).toBe(0)
      expect(calls).toBe(6)
      expect(most).toBe(2)
      expect((stored.get('summaries') as unknown[]).length).toBe(6)
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

  const NESTED = { ...PROJECT, 'tools/go.mod': 'module example.com/tools\n\ngo 1.22\n' }
  const REFRESH_PERIOD = 5 * 60_000

  test('after the start detection, an unchanged project is re-hashed on the refresh timer but never walked or rewritten', async ($, on) => {
    const clock = mock.clock(on)
    const stored = Fixtures.storeOn(on, { sources: [] })
    const fs = Fixtures.fsOn(on, NESTED)

    on('session.start', () => ({ cwd: '/repo' }))

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    const detection = JSON.stringify(stored.get('deps'))
    const reads = fs.reads.length

    expect(fs.lists).toContain('/repo/tools')

    await clock.advance(3 * REFRESH_PERIOD)

    expect(fs.lists.filter(path => path === '/repo/tools').length).toBe(1)
    expect(JSON.stringify(stored.get('deps'))).toBe(detection)
    // Each tick reads the recorded manifests again to compare their hashes.
    expect(fs.reads.length > reads).toBe(true)
  })

  test('a manifest changed after the start detection is detected again on the next refresh tick', async ($, on) => {
    const clock = mock.clock(on)
    const stored = Fixtures.storeOn(on, { sources: [] })
    const fs = Fixtures.fsOn(on, NESTED)

    on('session.start', () => ({ cwd: '/repo' }))

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    fs.write('go.mod', Go.K8S_GO_MOD.replace('cobra v1.10.2', 'cobra v1.11.0'))
    await clock.advance(REFRESH_PERIOD - 1)

    expect(
      Fixtures.depNamed(Fixtures.depsAt(stored, '/repo'), 'github.com/spf13/cobra')?.versionInUse,
    ).toBe('v1.10.2')

    await clock.advance(1)

    expect(
      Fixtures.depNamed(Fixtures.depsAt(stored, '/repo'), 'github.com/spf13/cobra')?.versionInUse,
    ).toBe('v1.11.0')
    expect(fs.lists.filter(path => path === '/repo/tools').length).toBe(2)
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

  for (const source of ['clear', 'resume', 'fork'] as const) {
    test(`classic.SessionStart ${source} registers /news again`, async ($, on) => {
      Fixtures.storeOn(on, { sources: [] })

      const registered = Fixtures.registerOn(on)

      on('classic.SessionStart', () => ({}))

      await $.classic.SessionStart({ source })

      expect(registered).toEqual([expect.objectContaining({ name: 'news', immediate: true })])
    })
  }

  const BAND_STORE = {
    sources: [Fixtures.sourceAt('src')],
    items: { src: Fixtures.datedItemsOf('src', 7) },
  }

  const BAND = {
    plugin: 'news',
    component: 'AbovePrompt',
    props: Fixtures.BAND_PROPS,
    surface: 'terminal',
  } as const

  const rangeOf = async (ui: {
    find: (query: { type: string; text: RegExp }) => Promise<unknown>
  }) => ((await ui.find({ type: 'Text', text: / of \d+$/ })) as { text?: string } | undefined)?.text

  test('session.start summarizes the page the band shows, once', async ($, on) => {
    const clock = mock.clock(on)
    const { asked } = Fixtures.bandOn(on, BAND_STORE)

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    expect([...asked].sort()).toEqual(['src 1', 'src 2', 'src 3'])

    const ui = await $.ui.mount(BAND)

    await ui.redraw()
    await clock.settle()

    expect(asked.length).toBe(3)
    expect(await ui.find({ type: 'Text', text: 'Summary of src 2.' })).toBeDefined()
  })

  test('/news rotate restarts the band timer once, at the new seconds', async ($, on) => {
    const clock = mock.clock(on)

    Fixtures.bandOn(on, { ...BAND_STORE, settings: { rotateSeconds: 20 } })

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    const ui = await $.ui.mount(BAND)

    await clock.advance(10_000)
    await $.command.run(Fixtures.newsOf('rotate 5'))
    await clock.advance(5000)

    expect(await rangeOf(ui)).toBe('4-6 of 7')

    // The old 20-second timer would turn a page here as well.
    await clock.advance(5000)

    expect(await rangeOf(ui)).toBe('7 of 7')

    await clock.advance(5000)

    expect(await rangeOf(ui)).toBe('1-3 of 7')
  })

  test('a refused /news rotate leaves the band timer alone', async ($, on) => {
    const clock = mock.clock(on)

    Fixtures.bandOn(on, { ...BAND_STORE, settings: { rotateSeconds: 20 } })

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    const ui = await $.ui.mount(BAND)

    await $.command.run(Fixtures.newsOf('rotate 1'))
    await clock.advance(19_999)

    expect(await rangeOf(ui)).toBe('1-3 of 7')

    await clock.advance(1)

    expect(await rangeOf(ui)).toBe('4-6 of 7')
  })

  test('a second session.start leaves one band timer', async ($, on) => {
    const clock = mock.clock(on)

    Fixtures.bandOn(on, { ...BAND_STORE, settings: { rotateSeconds: 20 } })

    await $.session.start(Fixtures.SESSION)
    await clock.settle()
    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    const ui = await $.ui.mount(BAND)

    await clock.advance(20_000)

    expect(await rangeOf(ui)).toBe('4-6 of 7')
  })

  test('/news reset restarts the band timer at the default seconds', async ($, on) => {
    const clock = mock.clock(on)
    const factory = Defaults.FACTORY_SOURCES.find(source => source.isEnabled)

    expect(factory).toBeDefined()

    const id = factory?.id ?? ''

    Fixtures.bandOn(on, {
      sources: [factory],
      items: { [id]: Fixtures.datedItemsOf(id, 7) },
      settings: { rotateSeconds: 600 },
    })

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    const ui = await $.ui.mount(BAND)

    await $.command.run(Fixtures.newsOf('reset'))
    await clock.advance(20_000)

    expect(await rangeOf(ui)).toBe('4-6 of 7')
  })

  test('/news reset summarizes the items shown in the default language', async ($, on) => {
    const clock = mock.clock(on)
    const factory = Defaults.FACTORY_SOURCES.find(source => source.isEnabled)
    const id = factory?.id ?? ''
    const items = Fixtures.datedItemsOf(id, 3)
    const { asked } = Fixtures.bandOn(on, {
      sources: [factory],
      items: { [id]: items },
      settings: { lang: 'es', rotateSeconds: 600 },
      summaries: items.map(item => ({
        itemId: item.id,
        lang: 'es',
        kind: 'short',
        text: 'Corto.',
      })),
    })

    await $.classic.SessionStart({ source: 'clear' })

    const ui = await $.ui.mount(BAND)

    expect((await ui.findAll({ type: 'Text', text: /^Corto\.$/ })).length).toBe(3)

    await $.command.run(Fixtures.newsOf('reset'))
    await clock.settle()

    expect([...asked].sort()).toEqual(items.map(item => item.title).sort())
    expect(await ui.find({ type: 'Text', text: `Summary of ${items[1]?.title}.` })).toBeDefined()
  })

  test('/news disable summarizes the page the band shows now, once per item', async ($, on) => {
    const clock = mock.clock(on)
    const shown = ['new:1', 'new:2', 'old:1']
    const { asked } = Fixtures.bandOn(on, {
      sources: [Fixtures.sourceAt('old'), Fixtures.sourceAt('new')],
      items: { old: Fixtures.datedItemsOf('old', 5, 10), new: Fixtures.datedItemsOf('new', 2) },
      summaries: shown.map(itemId => ({ itemId, lang: 'feed', kind: 'short', text: 'Cached.' })),
    })

    await $.classic.SessionStart({ source: 'clear' })

    const ui = await $.ui.mount(BAND)

    await $.command.run(Fixtures.newsOf('disable new'))
    await clock.settle()

    expect([...asked].sort()).toEqual(['old 2', 'old 3'])
    expect(await ui.find({ type: 'Text', text: 'Summary of old 3.' })).toBeDefined()

    await $.command.run(Fixtures.newsOf('disable new'))
    await clock.settle()

    expect(asked.length).toBe(2)
  })

  test('/news lang summarizes the items shown in the new language', async ($, on) => {
    const clock = mock.clock(on)
    const { asked } = Fixtures.bandOn(on, {
      ...BAND_STORE,
      summaries: ['src:1', 'src:2', 'src:3'].map(itemId => ({
        itemId,
        lang: 'feed',
        kind: 'short',
        text: `Cached ${itemId}.`,
      })),
    })

    await $.classic.SessionStart({ source: 'clear' })

    const ui = await $.ui.mount(BAND)

    expect(await ui.find({ type: 'Text', text: 'Cached src:2.' })).toBeDefined()

    await $.command.run(Fixtures.newsOf('lang es'))
    await clock.settle()

    expect([...asked].sort()).toEqual(['src 1', 'src 2', 'src 3'])
    expect(await ui.find({ type: 'Text', text: 'Summary of src 2.' })).toBeDefined()

    await $.command.run(Fixtures.newsOf('lang feed'))
    await clock.settle()

    expect(asked.length).toBe(3)
    expect(await ui.find({ type: 'Text', text: 'Cached src:2.' })).toBeDefined()
  })

  const REACT_FEED = 'https://github.com/owner/react/releases.atom'
  const REACT_PROJECT = Fixtures.stackTreeOf([
    Fixtures.stackItemAt('react', '19.0.0', { current: '18.2.0' }),
  ])
  const REACT_OVERRIDE = {
    depFeeds: { 'npm:react': { feed: REACT_FEED, resolvedAt: 0, isOverride: true } },
  }
  const STACK_BAND = { ...BAND, surface: 'terminal' } as const

  test('the stack loads silently at the start; a release new on a later refresh is flagged and toasted', async ($, on) => {
    const clock = mock.clock(on)
    const toasts: string[] = []
    const asked: string[] = []
    const pages = new Map([[REACT_FEED, Feeds.releasesAtomOf('react', [['v18.3.0'], ['v18.2.0']])]])
    const stored = Fixtures.storeOn(on, { sources: [], ...REACT_OVERRIDE })

    Fixtures.fsOn(on, REACT_PROJECT)
    Fixtures.registerOn(on)
    webOn(on, pages)
    on('ui.toast', ($, e) => {
      toasts.push(e.text)

      return { value: undefined }
    })
    on('ui.render', () => Fixtures.BELOW_BAND)
    on('model.complete', ($, e) => {
      asked.push(e.prompt)

      return { value: Fixtures.answerOf('{"breaking": true, "security": false}') }
    })
    on('session.start', () => ({ cwd: '/repo' }))

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    expect(Object.keys((stored.get('stack') as Record<string, unknown>) ?? {})).toEqual(['/repo'])
    expect(toasts).toEqual([])
    expect(asked).toEqual([])

    pages.set(REACT_FEED, Feeds.releasesAtomOf('react', [['v19.0.0'], ['v18.3.0']]))
    await clock.advance(60 * 60_000)

    expect(toasts).toEqual(['1 release: react 18.2.0 → 19.0.0 ⚠'])
    // The release the band showed since the start was checked once, the new one once.
    expect(asked.map(prompt => /^Version: v?(.*)$/m.exec(prompt)?.[1])).toEqual([
      '18.3.0',
      '19.0.0',
    ])

    const ui = await $.ui.mount(STACK_BAND)

    expect(await ui.find({ type: 'Link', text: 'react 18.2.0 → 19.0.0' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '⚠' })).toBeDefined()
  })

  test('release feeds are parsed with notes long enough that a late advisory id marks the band row ⚠', async ($, on) => {
    const clock = mock.clock(on)
    const notes = `${'Small fixes. '.repeat(60)}Fixes CVE-2026-0002.`

    Fixtures.storeOn(on, { sources: [], ...REACT_OVERRIDE })
    Fixtures.fsOn(on, REACT_PROJECT)
    Fixtures.registerOn(on)
    webOn(on, new Map([[REACT_FEED, Feeds.releasesAtomOf('react', [['v18.2.1', notes]])]]))
    on('ui.render', () => Fixtures.BELOW_BAND)
    on('session.start', () => ({ cwd: '/repo' }))

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    const ui = await $.ui.mount(STACK_BAND)

    expect(notes.length > 500).toBe(true)
    expect(await ui.find({ type: 'Link', text: 'react 18.2.0 → 18.2.1' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'npm · patch · security' })).toBeDefined()
  })

  test('a project with its stack off makes no registry or feed request, however long the session', async ($, on) => {
    const clock = mock.clock(on)

    Fixtures.storeOn(on, {
      sources: [],
      deps: { '/repo': { settings: { isEnabled: false } } },
    })
    Fixtures.fsOn(on, REACT_PROJECT)
    Fixtures.registerOn(on)

    const fetched = webOn(on, new Map())

    on('session.start', () => ({ cwd: '/repo' }))

    await $.session.start(Fixtures.SESSION)
    await clock.settle()
    await clock.advance(2 * 60 * 60_000)

    expect(fetched).toEqual([])
  })

  test('a failing registry is asked once, then left alone for the hour across refresh ticks', async ($, on) => {
    const clock = mock.clock(on)
    const REGISTRY = 'https://registry.npmjs.org/react/latest'

    Fixtures.storeOn(on, { sources: [] })
    Fixtures.fsOn(on, REACT_PROJECT)
    Fixtures.registerOn(on)

    const fetched = webOn(on, new Map())

    on('ui.log', () => ({ value: undefined }))
    on('session.start', () => ({ cwd: '/repo' }))

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    expect(fetched).toEqual([REGISTRY])

    await clock.advance(55 * 60_000)

    expect(fetched).toEqual([REGISTRY])

    await clock.advance(10 * 60_000)

    expect(fetched).toEqual([REGISTRY, REGISTRY])
  })

  const VITE_FEED = 'https://github.com/owner/vite/releases.atom'
  const TWO_PROJECT = Fixtures.stackTreeOf([
    Fixtures.stackItemAt('react', '19.0.0', { current: '18.2.0' }),
    Fixtures.stackItemAt('vite', '5.1.0', { current: '5.0.0' }),
  ])
  const REQUEST_DEADLINE = 30_000
  const HOUR = 60 * 60_000

  /** Answers the pages, holding every request to the hung addresses until `release` is called. */
  const holdingOn = (on: On, pages: Map<string, string>, hung: ReadonlySet<string>) => {
    const asked: string[] = []
    let release = () => {}
    const gate = new Promise<void>(resolve => {
      release = resolve
    })

    on('http.fetch', async ($, e) => {
      asked.push(e.url)

      if (hung.has(e.url)) {
        await gate
      }

      const text = pages.get(e.url)

      return text === undefined
        ? { deny: 'offline' }
        : { value: { status: 200, ok: true, headers: {}, text } }
    })

    return { asked, release }
  }

  const stackOf = (stored: Map<string, unknown>) =>
    Store.stackProjectOf((stored.get('stack') as Record<string, unknown> | undefined)?.['/repo'])

  test('a release feed that never answers frees the stack run at the deadline, pauses for an hour and lets the next refresh run', async ($, on) => {
    const clock = mock.clock(on)
    const logs: string[] = []
    const pages = new Map([
      [REACT_FEED, Feeds.releasesAtomOf('react', [['v18.3.0'], ['v18.2.0']])],
      [VITE_FEED, Feeds.releasesAtomOf('vite', [['v5.1.0'], ['v5.0.0']])],
    ])
    const stored = Fixtures.storeOn(on, {
      sources: [],
      depFeeds: {
        'npm:react': { feed: REACT_FEED, resolvedAt: 0, isOverride: true },
        'npm:vite': { feed: VITE_FEED, resolvedAt: 0, isOverride: true },
      },
    })

    Fixtures.fsOn(on, TWO_PROJECT)
    Fixtures.registerOn(on)

    const { asked, release } = holdingOn(on, pages, new Set([REACT_FEED]))

    on('ui.log', ($, e) => {
      logs.push(e.text)

      return { value: undefined }
    })
    on('session.start', () => ({ cwd: '/repo' }))

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    // The run writes its reads together at its end, so the hung feed holds it until the deadline.
    expect(asked.filter(url => url === REACT_FEED).length).toBe(1)
    expect(stored.get('stack')).toBeUndefined()

    await clock.advance(REQUEST_DEADLINE - 1)
    expect(stored.get('stack')).toBeUndefined()

    await clock.advance(1)

    expect(stackOf(stored).deps['npm:vite']).toBeDefined()
    expect(stackOf(stored).deps['npm:react']).toBeUndefined()

    expect(logs.filter(line => line.includes('timed out'))).toEqual([
      'news: deps: npm:react: release feed: timed out',
    ])

    // The held answer arriving after the deadline writes nothing.
    release()
    await clock.settle()

    expect(stackOf(stored).deps['npm:react']).toBeUndefined()

    pages.set(VITE_FEED, Feeds.releasesAtomOf('vite', [['v5.2.0'], ['v5.1.0'], ['v5.0.0']]))
    await clock.advance(HOUR - REQUEST_DEADLINE - 1)

    expect(asked.filter(url => url === REACT_FEED).length).toBe(1)

    await clock.advance(1)
    await clock.settle()

    expect(asked.filter(url => url === REACT_FEED).length).toBe(2)
    expect(stackOf(stored).deps['npm:react']?.items.map(item => item.release.version)).toEqual([
      '18.3.0',
    ])
    expect(stackOf(stored).deps['npm:vite']?.items.map(item => item.release.version)).toEqual([
      '5.2.0',
      '5.1.0',
    ])
  })

  test('a registry that never answers frees the stack run at the deadline, pauses for an hour and lets the next refresh run', async ($, on) => {
    const clock = mock.clock(on)
    const REGISTRY = 'https://registry.npmjs.org/react/latest'
    const pages = new Map([
      [REGISTRY, '{"repository":"github:owner/react"}'],
      ['https://registry.npmjs.org/vite/latest', '{"repository":"github:owner/vite"}'],
      [REACT_FEED, Feeds.releasesAtomOf('react', [['v18.3.0'], ['v18.2.0']])],
      [VITE_FEED, Feeds.releasesAtomOf('vite', [['v5.1.0'], ['v5.0.0']])],
    ])
    const logs: string[] = []
    const stored = Fixtures.storeOn(on, { sources: [] })

    Fixtures.fsOn(on, TWO_PROJECT)
    Fixtures.registerOn(on)

    const { asked, release } = holdingOn(on, pages, new Set([REGISTRY]))

    on('ui.log', ($, e) => {
      logs.push(e.text)

      return { value: undefined }
    })
    on('session.start', () => ({ cwd: '/repo' }))

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    expect(asked.filter(url => url === REGISTRY).length).toBe(1)
    expect(stored.get('stack')).toBeUndefined()

    await clock.advance(REQUEST_DEADLINE - 1)
    expect(stored.get('stack')).toBeUndefined()

    await clock.advance(1)

    expect(stackOf(stored).deps['npm:vite']).toBeDefined()

    expect(logs.filter(line => line.includes('timed out'))).toEqual([
      'news: deps: could not resolve npm:react: timed out',
    ])

    // The held answer arriving after the deadline caches and reads nothing.
    release()
    await clock.settle()

    expect(Object.keys(stored.get('depFeeds') as object)).toEqual(['npm:vite'])
    expect(stackOf(stored).deps['npm:react']).toBeUndefined()

    await clock.advance(HOUR - REQUEST_DEADLINE - 1)

    expect(asked.filter(url => url === REGISTRY).length).toBe(1)

    await clock.advance(1)
    await clock.settle()

    expect(asked.filter(url => url === REGISTRY).length).toBe(2)
    expect(Object.keys(stored.get('depFeeds') as object).sort()).toEqual(['npm:react', 'npm:vite'])
    expect(stackOf(stored).deps['npm:react']).toBeDefined()
  })

  test("a session reads its own project's releases only, and keeps them after /clear", async ($, on) => {
    const clock = mock.clock(on)
    const own = Fixtures.stackStoreOf([
      Fixtures.STACK_SAMPLE[0] ?? Fixtures.stackItemAt('a', '1.0.0'),
    ])
    const other = Fixtures.stackStoreOf([
      Fixtures.STACK_SAMPLE[1] ?? Fixtures.stackItemAt('b', '1.0.0'),
    ])

    Fixtures.bandOn(
      on,
      {
        sources: [],
        deps: { ...own.deps, '/other': other.deps['/repo'] },
        stack: { ...own.stack, '/other': other.stack['/repo'] },
      },
      REACT_PROJECT,
    )

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    const ui = await $.ui.mount(STACK_BAND)
    const links = async () =>
      (await ui.findAll({ type: 'Link' })).map(link => link.children.join(''))

    expect(await links()).toEqual(['react 18.2.0 → 19.0.0 · React 19'])

    await $.classic.SessionStart({ source: 'clear' })
    await ui.redraw()

    expect(await links()).toEqual(['react 18.2.0 → 19.0.0 · React 19'])
  })

  test('while the model is down, turning back to a page of stack releases asks about them once', async ($, on) => {
    const clock = mock.clock(on)
    const asked: string[] = []

    Fixtures.storeOn(on, {
      sources: [],
      ...Fixtures.stackStoreOf(Fixtures.STACK_SAMPLE, { showLevel: 'minor+' }),
    })
    Fixtures.fsOn(on, Fixtures.stackTreeOf(Fixtures.STACK_SAMPLE))
    Fixtures.registerOn(on)
    webOn(on, new Map())
    on('ui.log', () => ({ value: undefined }))
    on('ui.render', () => Fixtures.BELOW_BAND)
    on('model.complete', ($, e) => {
      asked.push(/^Package: (.*)$/m.exec(e.prompt)?.[1] ?? '')

      return { deny: 'model unavailable' }
    })
    on('session.start', () => ({ cwd: '/repo' }))

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    const ui = await $.ui.mount(STACK_BAND)

    // The second page holds zod alone; the first page is turned through in between.
    await ui.press({ key: 'next' })
    await ui.press({ key: 'next' })
    await ui.press({ key: 'next' })
    await clock.settle()

    expect(asked.filter(name => name === 'npm zod')).toEqual(['npm zod'])
    expect(asked.length).toBe(4)
  })

  /** The project at /repo following react, kept with its 19.0.0 release, next to one news source with one item, on a store whose writes are counted by key. */
  const stackAndNewsOn = (on: On) => {
    const react = Fixtures.STACK_SAMPLE[0] ?? Fixtures.stackItemAt('react', '19.0.0')
    const entries = new Map<string, unknown>(
      Object.entries({
        sources: [Fixtures.sourceAt('src')],
        items: { src: Fixtures.datedItemsOf('src', 1) },
        ...Fixtures.stackStoreOf([react]),
        ...REACT_OVERRIDE,
      }),
    )
    const writes: string[] = []

    on('store.get', ($, e) => ({ value: entries.get(e.key) }))
    on('store.set', ($, e) => {
      writes.push(e.key)
      entries.set(e.key, e.value)

      return { value: undefined }
    })

    const fs = Fixtures.fsOn(on, REACT_PROJECT)
    const fetched = webOn(
      on,
      new Map([[REACT_FEED, Feeds.releasesAtomOf('react', [['v19.0.0'], ['v18.2.0']])]]),
    )

    Fixtures.registerOn(on)
    Fixtures.logsOn(on)
    on('ui.render', () => Fixtures.BELOW_BAND)
    on('model.complete', () => ({ deny: 'offline' }))
    on('session.start', () => ({ cwd: '/repo' }))

    const manifestReads = () => fs.reads.filter(path => path === '/repo/package.json').length

    return { entries, writes, fetched, manifestReads }
  }

  const linksOf = async (ui: { findAll: (query: { type: string }) => Promise<unknown[]> }) =>
    ((await ui.findAll({ type: 'Link' })) as { children: string[] }[]).map(link =>
      link.children.join(''),
    )

  test('/news deps rescan detects the stack once and refreshes it once, off the dispatch', async ($, on) => {
    const clock = mock.clock(on)
    const { writes, manifestReads } = stackAndNewsOn(on)

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    const reads = manifestReads()
    const stackWrites = writes.filter(key => key === 'stack').length

    expect((await $.command.run(Fixtures.newsOf('deps rescan'))).text).toMatch(/^Detecting /)
    await clock.settle()

    expect(manifestReads()).toBe(reads + 1)
    expect(writes.filter(key => key === 'stack').length).toBe(stackWrites + 1)
  })

  test('a refused deps subcommand neither detects nor refreshes', async ($, on) => {
    const clock = mock.clock(on)
    const { writes, manifestReads } = stackAndNewsOn(on)

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    const reads = manifestReads()
    const count = writes.length

    for (const args of ['cap 0', 'ignore nope', 'map react nowhere', 'add zod', 'level loud']) {
      await $.command.run(Fixtures.newsOf(`deps ${args}`))
    }

    await clock.settle()

    expect(manifestReads()).toBe(reads)
    expect(writes.length).toBe(count)
  })

  test('/news deps ignore drops the package from the band at once and keeps it out after the rescan', async ($, on) => {
    const clock = mock.clock(on)
    const { manifestReads } = stackAndNewsOn(on)

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    const ui = await $.ui.mount(STACK_BAND)

    expect(await linksOf(ui)).toEqual(['react 18.2.0 → 19.0.0', 'src 1'])

    const reads = manifestReads()

    await $.command.run(Fixtures.newsOf('deps ignore react'))
    await ui.redraw()

    expect(await linksOf(ui)).toEqual(['src 1'])

    await clock.settle()
    await ui.redraw()

    expect(manifestReads()).toBe(reads + 1)
    expect(await linksOf(ui)).toEqual(['src 1'])
  })

  test('/news deps off hides only the stack items and makes no stack request afterwards', async ($, on) => {
    const clock = mock.clock(on)
    const { fetched } = stackAndNewsOn(on)

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    const ui = await $.ui.mount(STACK_BAND)

    expect((await linksOf(ui)).length).toBe(2)

    await $.command.run(Fixtures.newsOf('deps off'))
    await ui.redraw()

    expect(await linksOf(ui)).toEqual(['src 1'])

    const before = fetched.length

    await clock.advance(3 * 60 * 60_000)

    const after = fetched.slice(before)

    expect(after.length > 0).toBe(true)
    expect(after.every(url => url === Fixtures.sourceAt('src').url)).toBe(true)
  })

  test('/news deps map refreshes once and reads the new feed silently', async ($, on) => {
    const clock = mock.clock(on)
    const toasts: string[] = []
    const { fetched } = stackAndNewsOn(on)
    const NEW_FEED = 'https://example.org/react.atom'

    on('ui.toast', ($, e) => {
      toasts.push(e.text)

      return { value: undefined }
    })

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    const before = fetched.length

    expect((await $.command.run(Fixtures.newsOf(`deps map react ${NEW_FEED}`))).text).toBe(
      `npm:react now reads its releases from ${NEW_FEED}.`,
    )
    await clock.settle()

    expect(fetched.slice(before)).toEqual([NEW_FEED])
    expect(toasts).toEqual([])
  })
})
