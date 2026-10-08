import { describe, expect, test } from 'claude-code/testing'

import Refresh from '../../hooks/refresh'
import Fixtures from '../fixtures'
import Feeds from '../fixtures/feeds'

describe('refresh-all', () => {
  const ONE = Fixtures.sourceAt('one')
  const TWO = Fixtures.sourceAt('two')
  const OFF = Fixtures.sourceAt('off', { isEnabled: false })

  const hostWith = (sources: unknown[], entries: Record<string, unknown> = {}) => {
    const fake = Fixtures.fakeHostOf({ sources, ...entries })

    for (const source of [ONE, TWO, OFF]) {
      fake.web.set(source.url, { status: 200, text: Feeds.rssWithItems(2) })
    }

    return fake
  }

  test('fetches every enabled source and never a disabled one', async () => {
    const { host, fetched, stored } = hostWith([ONE, OFF, TWO])

    await Refresh.refreshAll(host, Refresh.refreshLoopOf())

    expect([...fetched].sort()).toEqual([ONE.url, TWO.url])
    expect(Object.keys(stored.get('items') as object).sort()).toEqual(['one', 'two'])
    expect(Object.keys(stored.get('seen') as object).sort()).toEqual(['one', 'two'])
  })

  test('a first load shows no toast; a later run shows one toast for the new items of every source', async () => {
    const { host, web, toasts } = hostWith([ONE, TWO])
    const loop = Refresh.refreshLoopOf()

    expect((await Refresh.refreshAll(host, loop)).newItems).toEqual([])
    expect(toasts).toEqual([])

    web.set(ONE.url, { status: 200, text: Feeds.rssWithItems(4) })
    web.set(TWO.url, { status: 200, text: Feeds.rssWithItems(3) })

    const run = await Refresh.refreshAll(host, loop)

    expect(run.newItems.map(item => item.id)).toEqual([
      'one:https://example.com/2',
      'one:https://example.com/3',
      'two:https://example.com/2',
    ])
    expect(toasts).toEqual(['3 new: Item 2 & more …'])

    await Refresh.refreshAll(host, loop)

    expect(toasts.length).toBe(1)
  })

  test('a source added later loads its backlog silently', async () => {
    const { host, stored, toasts } = hostWith([ONE])
    const loop = Refresh.refreshLoopOf()

    await Refresh.refreshAll(host, loop)
    stored.set('sources', [ONE, TWO])

    expect((await Refresh.refreshAll(host, loop)).newItems).toEqual([])
    expect(toasts).toEqual([])
  })

  test('a run in flight makes the next call skip without fetching', async () => {
    const { host, fetched } = hostWith([ONE])
    const loop = Refresh.refreshLoopOf()
    const fetch = host.httpFetch
    let release = () => {}
    let started = () => {}
    const isStarted = new Promise<void>(resolve => {
      started = resolve
    })

    host.httpFetch = async url => {
      started()
      await new Promise<void>(resolve => {
        release = resolve
      })

      return fetch(url)
    }

    const first = Refresh.refreshAll(host, loop)
    const skipped = { isSkipped: true, newItems: [], errors: {} }

    expect(await Refresh.refreshAll(host, loop)).toEqual(skipped)

    await isStarted

    expect(await Refresh.refreshAll(host, loop)).toEqual(skipped)

    release()

    expect((await first).isSkipped).toBe(false)
    expect(fetched).toEqual([ONE.url])
    expect(loop.run).toBeUndefined()

    host.httpFetch = fetch

    expect((await Refresh.refreshAll(host, loop)).isSkipped).toBe(false)
    expect(fetched).toEqual([ONE.url, ONE.url])
  })

  test('records the run in status: refreshing while it runs, then when and what failed', async () => {
    const { host, web, state } = hostWith([ONE, TWO])
    const loop = Refresh.refreshLoopOf()
    const seen: boolean[] = []
    const fetch = host.httpFetch

    host.httpFetch = async url => {
      seen.push((state.status as { isRefreshing: boolean }).isRefreshing)

      return fetch(url)
    }

    web.set(TWO.url, { status: 500, text: '' })
    await Refresh.refreshAll(host, loop)

    expect(seen).toEqual([true, true])
    expect(state.status).toEqual({
      lastRefreshAt: 1000,
      isRefreshing: false,
      errors: { two: 'HTTP 500' },
      refreshedAt: { one: 1000 },
    })

    web.set(TWO.url, { status: 200, text: Feeds.rssWithItems(1) })
    await Refresh.refreshAll(host, loop)

    expect(state.status).toEqual({
      lastRefreshAt: 1000,
      isRefreshing: false,
      errors: {},
      refreshedAt: { one: 1000, two: 1000 },
    })
  })

  test("keeps when each source last refreshed cleanly in the store, other sessions' times merged; a failure keeps the source's last time", async () => {
    const { host, web, state, stored } = hostWith([ONE, TWO], { refreshedAt: { other: 5 } })
    const loop = Refresh.refreshLoopOf()
    const clocks = [1000, 9000]

    host.clockNow = async () => clocks.shift() ?? 9000
    await Refresh.refreshAll(host, loop)

    expect(stored.get('refreshedAt')).toEqual({ other: 5, one: 1000, two: 1000 })

    web.set(TWO.url, { status: 503, text: '' })
    await Refresh.refreshAll(host, loop)

    expect(stored.get('refreshedAt')).toEqual({ other: 5, one: 9000, two: 1000 })
    expect(state.status).toMatchObject({
      errors: { two: 'HTTP 503' },
      refreshedAt: { other: 5, one: 9000, two: 1000 },
    })
  })

  test('a refresh time the store cannot keep is logged and still recorded in state', async () => {
    const { host, logs, state } = hostWith([ONE])
    const storeSet = host.storeSet

    host.storeSet = async (key, value) => {
      if (key === 'refreshedAt') {
        throw new Error('disk full')
      }

      return storeSet(key, value)
    }

    await Refresh.refreshAll(host, Refresh.refreshLoopOf())

    expect(logs).toEqual(['herald: could not record the refresh time: disk full'])
    expect(state.status).toMatchObject({ errors: {}, refreshedAt: { one: 1000 } })
  })

  test('a failing feed keeps its last items in state', async () => {
    const { host, web, state } = hostWith([ONE])
    const loop = Refresh.refreshLoopOf()

    await Refresh.refreshAll(host, loop)
    const before = state.items

    web.set(ONE.url, new Error('offline'))
    await Refresh.refreshAll(host, loop)

    expect(state.items).toEqual(before)
    expect((state.items as Record<string, unknown[]>).one?.length).toBe(2)
  })

  test('fetches at most three sources at once', async () => {
    const sources = ['a', 'b', 'c', 'd', 'e'].map(id => Fixtures.sourceAt(id))
    const { host, web } = Fixtures.fakeHostOf({ sources })
    const fetch = host.httpFetch
    let inFlight = 0
    let most = 0

    for (const source of sources) {
      web.set(source.url, { status: 200, text: Feeds.rssWithItems(1) })
    }

    host.httpFetch = async url => {
      inFlight += 1
      most = Math.max(most, inFlight)

      for (let tick = 0; tick < 20; tick += 1) {
        await Promise.resolve()
      }

      inFlight -= 1

      return fetch(url)
    }

    await Refresh.refreshAll(host, Refresh.refreshLoopOf())

    expect(most).toBe(3)
  })

  test("hands each run's new items to onRun; a failing onRun is logged, not thrown", async () => {
    const { host, web, logs } = hostWith([ONE])
    const runs: string[][] = []

    const loop = Refresh.refreshLoopOf((_, run) => {
      runs.push(run.newItems.map(item => item.id))

      throw new Error('summaries down')
    })

    await Refresh.refreshAll(host, loop)
    web.set(ONE.url, { status: 200, text: Feeds.rssWithItems(3) })

    expect((await Refresh.refreshAll(host, loop)).newItems.length).toBe(1)
    expect(runs).toEqual([[], ['one:https://example.com/2']])
    expect(logs).toEqual([
      'herald: after the refresh: summaries down',
      'herald: after the refresh: summaries down',
    ])
  })

  test("hands onRun the run's abort signal", async () => {
    const { host } = hostWith([ONE])
    const signals: AbortSignal[] = []
    let running: AbortController | undefined

    const loop = Refresh.refreshLoopOf((_, run, signal) => {
      running = loop.run
      signals.push(signal)
    })

    await Refresh.refreshAll(host, loop)

    expect(signals.length).toBe(1)
    expect(running).toBeDefined()
    expect(signals[0]).toBe(running?.signal)
  })

  test("passes the run's abort signal to page extractions", async () => {
    const page = Fixtures.sourceAt('page', { kind: 'page', url: 'https://example.com/news' })
    const { host, web, asked } = Fixtures.fakeHostOf({ sources: [page] })
    const loop = Refresh.refreshLoopOf()
    let running: AbortController | undefined

    web.set(page.url, { status: 200, text: '<a href="/news/a">A</a>' })
    host.modelComplete = async (request, signal) => {
      running = loop.run
      asked.push({ request, ...(signal === undefined ? {} : { signal }) })

      return Fixtures.answerOf('[]')
    }

    await Refresh.refreshAll(host, loop)

    expect(running).toBeDefined()
    expect(asked[0]?.signal).toBe(running?.signal)
  })

  test('a store that fails ends the run with one debug line, never thrown', async () => {
    const { host, logs, state } = hostWith([ONE])
    const loop = Refresh.refreshLoopOf()

    host.storeGet = async () => {
      throw new Error('store unavailable')
    }

    expect(await Refresh.refreshAll(host, loop)).toEqual({
      isSkipped: false,
      newItems: [],
      errors: {},
    })
    expect(logs).toEqual(['herald: the refresh failed: store unavailable'])
    expect((state.status as { isRefreshing: boolean }).isRefreshing).toBe(false)
    expect(loop.run).toBeUndefined()
  })

  const deadlineOf = async (afters: { ms: number; fn: () => void }[], ms: number) => {
    for (let tick = 0; tick < 100; tick += 1) {
      const found = afters.find(after => after.ms === ms)

      if (found !== undefined) {
        return found
      }

      await Promise.resolve()
    }

    throw new Error(`no ${ms} ms deadline`)
  }

  test('a source whose fetch never answers times out alone; the run ends and the next one starts', async () => {
    const { host, afters, logs, state, fetched } = hostWith([ONE, TWO])
    const loop = Refresh.refreshLoopOf()
    const fetch = host.httpFetch

    host.httpFetch = async url => (url === ONE.url ? new Promise(() => {}) : fetch(url))

    const run = Refresh.refreshAll(host, loop)

    ;(await deadlineOf(afters, Refresh.REFRESH_LIMITS.sourceTimeoutMs)).fn()

    expect((await run).errors).toEqual({ one: 'timed out' })
    expect(logs).toEqual(['herald: one: timed out'])
    expect((state.status as { isRefreshing: boolean }).isRefreshing).toBe(false)
    expect(loop.run).toBeUndefined()
    expect(Object.keys(state.items as object)).toEqual(['two'])

    host.httpFetch = fetch

    expect((await Refresh.refreshAll(host, loop)).isSkipped).toBe(false)
    expect(fetched.filter(url => url === ONE.url).length).toBe(1)
  })

  test('a run that hangs past its deadline is aborted, clears refreshing and lets the next one start', async () => {
    const { host, afters, logs, state } = hostWith([ONE])
    const loop = Refresh.refreshLoopOf()
    const storeGet = host.storeGet

    host.storeGet = async key => (key === 'sources' ? new Promise(() => {}) : storeGet(key))

    const run = Refresh.refreshAll(host, loop)
    const controller = loop.run

    ;(await deadlineOf(afters, Refresh.REFRESH_LIMITS.runTimeoutMs)).fn()

    expect(await run).toEqual({ isSkipped: false, newItems: [], errors: {} })
    expect(controller?.signal.aborted).toBe(true)
    expect(loop.run).toBeUndefined()
    expect(logs).toEqual(['herald: the refresh timed out'])

    await Promise.resolve()

    expect((state.status as { isRefreshing: boolean }).isRefreshing).toBe(false)

    host.storeGet = storeGet

    expect((await Refresh.refreshAll(host, loop)).isSkipped).toBe(false)
  })

  test('deadlines are cancelled once the work is done', async () => {
    const { host, afters } = hostWith([ONE, TWO])

    await Refresh.refreshAll(host, Refresh.refreshLoopOf())

    expect(afters.map(after => after.ms).sort((a, b) => a - b)).toEqual([
      Refresh.REFRESH_LIMITS.sourceTimeoutMs,
      Refresh.REFRESH_LIMITS.sourceTimeoutMs,
      Refresh.REFRESH_LIMITS.runTimeoutMs,
    ])
    expect(afters.every(after => after.isCancelled)).toBe(true)
  })
})
