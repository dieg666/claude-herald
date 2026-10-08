import { describe, expect, test } from 'claude-code/testing'

import type { DepsSettings, DepsToastLevel, StackProject } from '../../../types/index.js'
import type { Dependency } from '../../../types/index.js'
import Resolve from '../../../hooks/deps/resolve'
import Stack from '../../../hooks/deps/stack'
import type { Host } from '../../../hooks/host'
import Store from '../../../hooks/store'
import Summaries from '../../../hooks/summaries'
import Fixtures from '../../fixtures'
import Feeds from '../../fixtures/feeds'

describe('refresh-stack', () => {
  const NOW = 1_000_000_000
  const HOUR = 60 * 60_000
  const feedOf = (name: string) => `https://github.com/owner/${name}/releases.atom`
  const REACT = Fixtures.depAt('react', { versionInUse: '18.2.0' })

  /** A started stack over a project at /repo following those packages, each mapped to its feed, on a clock at NOW. */
  const stackAt = (
    dependencies: readonly Dependency[] = [REACT],
    settings: Partial<DepsSettings> = {},
    entries: Readonly<Record<string, unknown>> = {},
  ) => {
    const depFeeds = Object.fromEntries(
      dependencies.map(dependency => [
        `${dependency.ecosystem}:${dependency.name}`,
        { repo: `owner/${dependency.name}`, feed: feedOf(dependency.name), resolvedAt: NOW },
      ]),
    )
    const clocked = Fixtures.clockedHostOf(
      {
        deps: {
          '/repo': {
            settings,
            dependencies,
            detectedCount: dependencies.length,
            manifestHashes: {},
            detectedAt: 1,
          },
        },
        depFeeds,
        ...entries,
      },
      NOW,
    )
    const loop = Stack.stackLoopOf()
    const fs = Fixtures.fakeFsOf('/repo', { '.git': { isDir: true } })

    Object.assign(clocked.host, fs)
    loop.isStarted = true

    const refresh = () => Stack.refreshStack(clocked.host, loop, Summaries.summaryJobsOf())

    return { ...clocked, fs, loop, refresh }
  }

  const keptOf = (stored: ReadonlyMap<string, unknown>, key = 'npm:react') =>
    Store.stackProjectOf((stored.get('stack') as Record<string, unknown>)['/repo']).deps[key]

  test('before the start detection a refresh does nothing', async () => {
    const { host, fetched } = stackAt()

    const run = await Stack.refreshStack(host, Stack.stackLoopOf(), Summaries.summaryJobsOf())

    expect(run.isSkipped).toBe(true)
    expect(fetched).toEqual([])
  })

  test('a first read keeps the releases above the version in use, mirrors them to state, toasts and asks nothing', async () => {
    const { web, fetched, stored, state, toasts, asked, refresh } = stackAt()

    web.set(feedOf('react'), {
      status: 200,
      text: Feeds.releasesAtomOf('react', [['v18.3.0'], ['v18.2.0'], ['v18.1.0']]),
    })

    const run = await refresh()

    expect(fetched).toEqual([feedOf('react')])
    expect(run).toEqual({ isSkipped: false, checked: ['npm:react'], newReleases: [] })
    expect(keptOf(stored)).toMatchObject({ checkedAt: NOW, current: '18.2.0' })
    expect(keptOf(stored)?.items.map(item => item.release.version)).toEqual(['18.3.0'])
    expect(keptOf(stored)?.seen).toEqual(
      ['v18.3.0', 'v18.2.0', 'v18.1.0'].map(
        tag => `npm:react|tag:github.com,2008:Repository/1/${tag}`,
      ),
    )
    expect(state.stack).toMatchObject({ root: '/repo', filter: '' })
    expect((state.stack as { items: unknown[] }).items).toEqual(keptOf(stored)?.items)
    expect(toasts).toEqual([])
    expect(asked).toEqual([])
  })

  test('a release new since the last read is flagged by the model and toasted; one already seen is not', async () => {
    const { web, stored, toasts, asked, replies, clock, refresh } = stackAt()

    web.set(feedOf('react'), {
      status: 200,
      text: Feeds.releasesAtomOf('react', [['v18.3.0'], ['v18.2.0']]),
    })
    await refresh()

    web.set(feedOf('react'), {
      status: 200,
      text: Feeds.releasesAtomOf('react', [['v19.0.0', 'Drops the legacy root API.'], ['v18.3.0']]),
    })
    replies.push(Fixtures.answerOf('{"breaking": true, "security": false}'))
    await clock.advance(HOUR)

    const run = await refresh()

    expect(asked.length).toBe(1)
    expect(asked[0]?.request.prompt).toMatch(/Version: v19\.0\.0/)
    expect(run.newReleases.map(item => item.release.version)).toEqual(['19.0.0'])
    expect(toasts).toEqual(['1 release: react 18.2.0 → 19.0.0 ⚠'])
    expect(
      keptOf(stored)?.items.map(item => [item.release.version, item.release.breaking]),
    ).toEqual([
      ['19.0.0', true],
      ['18.3.0', false],
    ])

    await clock.advance(HOUR)
    await refresh()

    expect(toasts.length).toBe(1)
    expect(asked.length).toBe(1)
  })

  const TOASTS: Record<DepsToastLevel, string[]> = {
    all: ['3 releases: react 18.2.0 → 19.0.0 …'],
    'minor+': ['2 releases: react 18.2.0 → 19.0.0, react 18.2.0 → 18.4.0'],
    'major+breaking+security': ['1 release: react 18.2.0 → 19.0.0'],
    'breaking+security': [],
    off: [],
  }

  for (const [toastLevel, expected] of Object.entries(TOASTS) as [DepsToastLevel, string[]][]) {
    test(`toast level ${toastLevel} toasts ${expected.length === 0 ? 'nothing' : expected[0]}`, async () => {
      const { web, toasts, clock, refresh } = stackAt([REACT], { toastLevel })

      web.set(feedOf('react'), {
        status: 200,
        text: Feeds.releasesAtomOf('react', [['v18.2.0']]),
      })
      await refresh()

      web.set(feedOf('react'), {
        status: 200,
        text: Feeds.releasesAtomOf('react', [['v19.0.0'], ['v18.4.0'], ['v18.2.1'], ['v18.2.0']]),
      })
      await clock.advance(HOUR)
      await refresh()

      expect(toasts).toEqual(expected)
    })
  }

  test('a breaking or security release is toasted first', async () => {
    const vite = Fixtures.depAt('vite', { versionInUse: '5.0.0' })
    const { web, toasts, clock, refresh } = stackAt([REACT, vite], { toastLevel: 'all' })

    web.set(feedOf('react'), { status: 200, text: Feeds.releasesAtomOf('react', [['v18.2.0']]) })
    web.set(feedOf('vite'), { status: 200, text: Feeds.releasesAtomOf('vite', [['v5.0.0']]) })
    await refresh()

    web.set(feedOf('react'), {
      status: 200,
      text: Feeds.releasesAtomOf('react', [['v18.3.0']]),
    })
    web.set(feedOf('vite'), {
      status: 200,
      text: Feeds.releasesAtomOf('vite', [['v5.0.1', 'Fixes CVE-2026-0001.']]),
    })
    await clock.advance(HOUR)
    await refresh()

    expect(toasts).toEqual(['2 releases: vite 5.0.0 → 5.0.1 ⚠, react 18.2.0 → 18.3.0'])
  })

  test('release notes are read past the feed summary cap, so a late advisory id still flags security', async () => {
    const { web, stored, refresh } = stackAt()
    const notes = `${'Many small fixes and improvements. '.repeat(30)}Fixes CVE-2026-1234.`

    expect(notes.length > 500).toBe(true)

    web.set(feedOf('react'), {
      status: 200,
      text: Feeds.releasesAtomOf('react', [['v18.2.1', notes]]),
    })
    await refresh()

    expect(keptOf(stored)?.items[0]?.release).toMatchObject({ version: '18.2.1', security: true })
  })

  test('a project with its stack off makes no request and mirrors the setting to state', async () => {
    const { web, fetched, state, refresh } = stackAt([REACT], { isEnabled: false })

    web.set(feedOf('react'), { status: 200, text: Feeds.releasesAtomOf('react', [['v19.0.0']]) })

    await refresh()

    expect(fetched).toEqual([])
    expect(state.stack).toMatchObject({ root: '/repo', settings: { isEnabled: false } })
  })

  test('a feed read within the hour is not read again, unless the version in use changed', async () => {
    const { web, fetched, stored, clock, refresh } = stackAt()

    web.set(feedOf('react'), {
      status: 200,
      text: Feeds.releasesAtomOf('react', [['v18.3.0'], ['v18.2.0']]),
    })
    await refresh()
    await clock.advance(HOUR - 1)
    await refresh()

    expect(fetched.length).toBe(1)

    const deps = stored.get('deps') as { '/repo': { dependencies: Dependency[] } }

    deps['/repo'].dependencies = [{ ...REACT, versionInUse: '18.3.0' }]
    await refresh()

    expect(fetched.length).toBe(2)
    expect(keptOf(stored)?.items).toEqual([])

    await clock.advance(1)
    await refresh()

    expect(fetched.length).toBe(2)
  })

  test('a failing release feed waits out the hour before it is read again, with one debug line', async () => {
    const { fetched, logs, clock, refresh } = stackAt()

    await refresh()
    await clock.advance(Stack.STACK_LIMITS.failureWindowMs - 1)
    await refresh()

    expect(fetched).toEqual([feedOf('react')])
    expect(logs).toEqual([expect.stringMatching(/^news: deps: npm:react: release feed: /)])

    await clock.advance(1)
    await refresh()

    expect(fetched).toEqual([feedOf('react'), feedOf('react')])
  })

  test('a failing registry lookup waits out the hour; a definite answer does not', async () => {
    const { fetched, web, clock, refresh } = stackAt(
      [REACT, Fixtures.depAt('gone')],
      {},
      { depFeeds: {} },
    )
    const REGISTRY = 'https://registry.npmjs.org/react/latest'
    const GONE = 'https://registry.npmjs.org/gone/latest'

    web.set(GONE, { status: 404, text: '' })

    await refresh()

    expect(fetched).toEqual([REGISTRY, GONE])

    await clock.advance(Stack.STACK_LIMITS.failureWindowMs - 1)
    await refresh()

    expect(fetched).toEqual([REGISTRY, GONE])

    await clock.advance(1)
    await refresh()

    expect(fetched).toEqual([REGISTRY, GONE, REGISTRY])
  })

  /** Makes every request to these addresses hang, noting each. */
  const hangOn = (host: { httpFetch: Host['httpFetch'] }, hung: Set<string>, asked: string[]) => {
    const fetch = host.httpFetch

    host.httpFetch = (url, init) => {
      if (!hung.has(url)) {
        return fetch(url, init)
      }

      asked.push(url)

      return new Promise(() => {})
    }
  }

  const DEADLINE = Resolve.RESOLVE_LIMITS.requestTimeoutMs

  test('a release feed that never answers ends the run at the deadline, spares the other feeds and waits out the hour', async () => {
    const vite = Fixtures.depAt('vite', { versionInUse: '5.0.0' })
    const { host, web, stored, logs, loop, clock, refresh } = stackAt([REACT, vite])
    const asked: string[] = []

    web.set(feedOf('vite'), { status: 200, text: Feeds.releasesAtomOf('vite', [['v5.1.0']]) })
    hangOn(host, new Set([feedOf('react')]), asked)

    const run = refresh()

    await clock.advance(DEADLINE - 1)
    expect(loop.running).toBeDefined()

    await clock.advance(1)

    expect((await run).checked).toEqual(['npm:vite'])
    expect(loop.running).toBeUndefined()
    expect(keptOf(stored, 'npm:vite')?.items.length).toBe(1)
    expect(keptOf(stored)).toBeUndefined()
    expect(logs).toEqual(['news: deps: npm:react: release feed: timed out'])
    expect(asked).toEqual([feedOf('react')])

    await clock.advance(Stack.STACK_LIMITS.failureWindowMs - DEADLINE - 1)
    await refresh()
    expect(asked.length).toBe(1)

    await clock.advance(1)

    const next = refresh()

    await clock.advance(DEADLINE)
    await next
    expect(asked.length).toBe(2)
  })

  test('a registry that never answers ends the run at the deadline, spares the other lookups and waits out the hour', async () => {
    const vite = Fixtures.depAt('vite', { versionInUse: '5.0.0' })
    const REGISTRY = 'https://registry.npmjs.org/react/latest'
    const { host, web, stored, logs, loop, clock, refresh } = stackAt(
      [REACT, vite],
      {},
      { depFeeds: {} },
    )
    const asked: string[] = []

    web.set('https://registry.npmjs.org/vite/latest', {
      status: 200,
      text: '{"repository":{"url":"git+https://github.com/owner/vite.git"}}',
    })
    web.set(feedOf('vite'), { status: 200, text: Feeds.releasesAtomOf('vite', [['v5.1.0']]) })
    hangOn(host, new Set([REGISTRY]), asked)

    const run = refresh()

    await clock.advance(DEADLINE)

    expect((await run).checked).toEqual(['npm:vite'])
    expect(loop.running).toBeUndefined()
    expect(keptOf(stored, 'npm:vite')?.items.length).toBe(1)
    expect(Object.keys(stored.get('depFeeds') as object)).toEqual(['npm:vite'])
    expect(logs).toEqual(['news: deps: could not resolve npm:react: timed out'])
    expect(asked).toEqual([REGISTRY])

    await clock.advance(Stack.STACK_LIMITS.failureWindowMs - DEADLINE - 1)
    await refresh()
    expect(asked.length).toBe(1)

    await clock.advance(1)

    const next = refresh()

    await clock.advance(DEADLINE)
    await next
    expect(asked.length).toBe(2)
  })

  test('one run reads at most a few feeds and looks up at most a few packages, the rest in later runs', async () => {
    const many = Array.from({ length: 12 }, (_, index) =>
      Fixtures.depAt(`p${index}`, { versionInUse: '1.0.0' }),
    )
    const unknown = Array.from({ length: 12 }, (_, index) => Fixtures.depAt(`u${index}`))
    const { fetched, stored, web, refresh } = stackAt(many)

    for (const dependency of many) {
      web.set(feedOf(dependency.name), {
        status: 200,
        text: Feeds.releasesAtomOf(dependency.name, []),
      })
    }

    await refresh()

    expect(fetched.length).toBe(Stack.STACK_LIMITS.feedsPerRun)

    await refresh()

    expect(fetched.length).toBe(12)

    const deps = stored.get('deps') as { '/repo': { dependencies: Dependency[] } }

    deps['/repo'].dependencies = [...many, ...unknown]
    fetched.length = 0
    await refresh()

    expect(fetched.filter(url => url.includes('registry.npmjs.org')).length).toBe(
      Stack.STACK_LIMITS.lookupsPerRun,
    )
  })

  test('the store keeps a few releases per package, the newest, and drops packages no longer followed', async () => {
    const vite = Fixtures.depAt('vite', { versionInUse: '1.0.0' })
    const { web, stored, refresh } = stackAt([REACT, vite])
    const tags = Array.from({ length: 10 }, (_, index) => [`v18.${12 - index}.0`] as const)

    web.set(feedOf('react'), { status: 200, text: Feeds.releasesAtomOf('react', tags) })
    web.set(feedOf('vite'), { status: 200, text: Feeds.releasesAtomOf('vite', [['v2.0.0']]) })
    await refresh()

    expect(keptOf(stored)?.items.map(item => item.release.version)).toEqual([
      '18.12.0',
      '18.11.0',
      '18.10.0',
      '18.9.0',
      '18.8.0',
    ])
    expect(keptOf(stored)?.seen.length).toBe(Stack.STACK_LIMITS.seenPerDep)
    expect(keptOf(stored, 'npm:vite')?.items.length).toBe(1)

    const deps = stored.get('deps') as { '/repo': { dependencies: Dependency[] } }

    deps['/repo'].dependencies = [REACT]
    await refresh()

    const project = (stored.get('stack') as Record<string, StackProject>)['/repo']

    expect(Object.keys(project?.deps ?? {})).toEqual(['npm:react'])
  })

  test('a refresh asked while one runs runs once more after it, never alongside', async () => {
    const { web, fetched, fs, clock, refresh, loop } = stackAt()
    let release = () => {}

    web.set(feedOf('react'), { status: 200, text: Feeds.releasesAtomOf('react', []) })

    const held = new Promise<void>(resolve => {
      release = resolve
    })
    const first = loop.serially(() => held)
    const running = refresh()
    const second = await refresh()

    expect(second.isSkipped).toBe(true)

    release()
    await first
    await running
    await clock.settle()

    expect(loop.running).toBeUndefined()
    expect(fetched.length).toBe(1)
    // Each run looks the project up once: the first, then the one asked meanwhile.
    expect(fs.lists.filter(path => path === '/repo').length).toBe(2)
  })

  for (const [change, patch] of [
    ['turned off', { settings: { isEnabled: false, toastLevel: 'all' } }],
    ['ignored', { ignored: ['npm:react'], dependencies: [] }],
  ] as const) {
    test(`a package ${change} while a run reads its feed is neither toasted nor kept in state`, async () => {
      const { web, stored, state, toasts, clock, loop, refresh } = stackAt([REACT], {
        toastLevel: 'all',
      })

      web.set(feedOf('react'), { status: 200, text: Feeds.releasesAtomOf('react', [['v18.2.0']]) })
      await refresh()
      web.set(feedOf('react'), { status: 200, text: Feeds.releasesAtomOf('react', [['v19.0.0']]) })
      await clock.advance(HOUR)

      let release = () => {}
      const held = new Promise<void>(resolve => {
        release = resolve
      })
      const first = loop.serially(() => held)
      const running = refresh()

      await clock.settle()

      const projects = stored.get('deps') as Record<string, Record<string, unknown>>

      stored.set('deps', { '/repo': { ...projects['/repo'], ...patch } })
      release()
      await first
      await running

      const stack = state.stack as { settings: { isEnabled: boolean }; items: unknown[] }

      expect(toasts).toEqual([])
      expect(Stack.shownStackItemsOf(state.stack as never)).toEqual([])
      expect(stack.settings.isEnabled).toBe(change !== 'turned off')
    })
  }

  test('a stack turned off while a run looks packages up reads no feed after the lookups', async () => {
    const vite = Fixtures.depAt('vite', { versionInUse: '5.0.0' })
    const { host, stored, state, fetched, clock, refresh } = stackAt(
      [REACT, vite],
      {},
      {
        depFeeds: { 'npm:react': { repo: 'owner/react', feed: feedOf('react'), resolvedAt: NOW } },
      },
    )
    const fetch = host.httpFetch
    let release = () => {}
    const held = new Promise<void>(resolve => {
      release = resolve
    })

    host.httpFetch = async (url, init) => {
      if (url.includes('registry.npmjs.org')) {
        fetched.push(url)
        await held

        return { status: 404, ok: false, text: '' }
      }

      return fetch(url, init)
    }

    const running = refresh()

    await clock.settle()

    const projects = stored.get('deps') as Record<string, Record<string, unknown>>

    stored.set('deps', { '/repo': { ...projects['/repo'], settings: { isEnabled: false } } })
    release()
    await running

    expect(fetched).toEqual(['https://registry.npmjs.org/vite/latest'])
    expect((state.stack as { settings: { isEnabled: boolean } }).settings.isEnabled).toBe(false)
  })

  test('a feed read whose package was mapped elsewhere during the run is neither kept nor toasted', async () => {
    const { host, web, stored, toasts, clock, refresh } = stackAt([REACT], { toastLevel: 'all' })

    web.set(feedOf('react'), { status: 200, text: Feeds.releasesAtomOf('react', [['v18.2.0']]) })
    await refresh()
    await clock.advance(HOUR)

    const fetch = host.httpFetch
    let release = () => {}
    const held = new Promise<void>(resolve => {
      release = resolve
    })

    host.httpFetch = async (url, init) => {
      await held

      return { status: 200, ok: true, text: Feeds.releasesAtomOf('react', [['v19.0.0']]) }
    }

    const running = refresh()

    await clock.settle()
    stored.set('depFeeds', {
      'npm:react': { feed: 'https://example.org/react.atom', resolvedAt: NOW, isOverride: true },
    })
    host.httpFetch = fetch
    release()
    await running

    expect(toasts).toEqual([])
    expect(keptOf(stored)?.items.map(item => item.release.version)).toEqual([])
  })

  test('a feed missing at first (404) stays silent once it appears; only later releases toast', async () => {
    const { web, toasts, clock, refresh } = stackAt([REACT], { toastLevel: 'all' })

    web.set(feedOf('react'), { status: 404, text: '' })
    await refresh()

    web.set(feedOf('react'), {
      status: 200,
      text: Feeds.releasesAtomOf('react', [['v18.3.0'], ['v18.2.0']]),
    })
    await clock.advance(HOUR)
    await refresh()

    expect(toasts).toEqual([])

    web.set(feedOf('react'), {
      status: 200,
      text: Feeds.releasesAtomOf('react', [['v18.4.0'], ['v18.3.0'], ['v18.2.0']]),
    })
    await clock.advance(HOUR)
    await refresh()

    expect(toasts).toEqual(['1 release: react 18.2.0 → 18.4.0'])
  })

  test('a feed whose entries are all at or below the version in use still counts as read, so a later release toasts', async () => {
    const { web, toasts, clock, refresh } = stackAt([REACT], { toastLevel: 'all' })

    web.set(feedOf('react'), { status: 200, text: Feeds.releasesAtomOf('react', [['v18.2.0']]) })
    await refresh()

    web.set(feedOf('react'), {
      status: 200,
      text: Feeds.releasesAtomOf('react', [['v18.2.1'], ['v18.2.0']]),
    })
    await clock.advance(HOUR)
    await refresh()

    expect(toasts).toEqual(['1 release: react 18.2.0 → 18.2.1'])
  })
})
