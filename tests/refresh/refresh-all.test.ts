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
    })

    web.set(TWO.url, { status: 200, text: Feeds.rssWithItems(1) })
    await Refresh.refreshAll(host, loop)

    expect(state.status).toEqual({ lastRefreshAt: 1000, isRefreshing: false, errors: {} })
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
      'news: after the refresh: summaries down',
      'news: after the refresh: summaries down',
    ])
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
    expect(logs).toEqual(['news: the refresh failed: store unavailable'])
    expect((state.status as { isRefreshing: boolean }).isRefreshing).toBe(false)
    expect(loop.run).toBeUndefined()
  })
})
