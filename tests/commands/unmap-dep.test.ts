import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'
import Stack from '../../hooks/deps/stack'
import Store from '../../hooks/store'
import Summaries from '../../hooks/summaries'
import Fixtures from '../fixtures'
import Feeds from '../fixtures/feeds'

describe('unmap-dep', () => {
  const NOW = 1_000_000_000
  const MAPPED = 'https://github.com/fork/react/releases.atom'
  const REGISTRY = 'https://registry.npmjs.org/react/latest'
  const OWN = 'https://github.com/owner/react/releases.atom'
  const USAGE = '\nUsage: /news deps map <package> <owner/repo|feed-url|off>'
  const KEPT = { checkedAt: 1, seen: ['npm:react|old'], items: [] }

  /** A host on /repo following react, mapped to a fork; /other keeps react's releases too. */
  const hostAt = (
    entries: Readonly<Record<string, unknown>> = {},
    settings: Readonly<Record<string, unknown>> = {},
  ) => {
    const clocked = Fixtures.clockedHostOf(
      {
        deps: {
          '/repo': {
            settings,
            dependencies: [Fixtures.depAt('react', { versionInUse: '18.2.0' })],
            detectedAt: 1,
          },
        },
        depFeeds: {
          'npm:react': { repo: 'fork/react', feed: MAPPED, resolvedAt: NOW, isOverride: true },
        },
        stack: {
          '/repo': { deps: { 'npm:react': KEPT, 'npm:vite': KEPT }, refreshedAt: 1 },
          '/other': { deps: { 'npm:react': KEPT }, refreshedAt: 1 },
        },
        ...entries,
      },
      NOW,
    )

    Object.assign(clocked.host, Fixtures.fakeFsOf('/repo', { '.git': { isDir: true } }))

    return { ...clocked, loop: Stack.stackLoopOf() }
  }

  const keptIn = (stored: ReadonlyMap<string, unknown>, root: string) =>
    Object.keys(
      Store.stackProjectOf((stored.get('stack') as Record<string, unknown>)[root]).deps,
    ).sort()

  test('clears the mapping and drops this project’s kept releases of the package only, asking for a refresh', async () => {
    const { host, stored, loop } = hostAt()

    const reply = await Commands.runNews(host, 'deps map react off', loop)

    expect(reply).toEqual({
      text: 'npm:react reads its releases from its registry again.',
      refreshStack: true,
    })
    expect(Store.depFeedsOf(stored.get('depFeeds'))).toEqual({})
    expect(keptIn(stored, '/repo')).toEqual(['npm:vite'])
    expect(keptIn(stored, '/other')).toEqual(['npm:react'])
  })

  test('off is accepted in any case and mirrors the drop to state', async () => {
    const { host, state, stored, loop } = hostAt()

    await Commands.runNews(host, 'deps map react OFF', loop)

    expect(Store.depFeedsOf(stored.get('depFeeds'))).toEqual({})
    expect(JSON.stringify(state.stack)).not.toContain('react')
  })

  test('a package with no mapping is refused with the usage line and nothing changes', async () => {
    const { host, stored, loop } = hostAt({
      depFeeds: { 'npm:react': { repo: 'owner/react', feed: OWN, resolvedAt: NOW } },
    })
    const before = JSON.stringify([stored.get('depFeeds'), stored.get('stack')])

    const reply = await Commands.runNews(host, 'deps map react off', loop)

    expect(reply).toEqual({
      text: `npm:react has no mapping to undo; it reads its releases from its registry.${USAGE}`,
    })
    expect(JSON.stringify([stored.get('depFeeds'), stored.get('stack')])).toBe(before)

    const none = hostAt({ depFeeds: {} })

    expect((await Commands.runNews(none.host, 'deps map react off', none.loop)).text).toMatch(
      /^npm:react has no mapping to undo/,
    )
  })

  test('a package this project does not know is refused as map refuses it', async () => {
    const { host, loop } = hostAt()

    expect((await Commands.runNews(host, 'deps map nope off', loop)).text).toBe(
      `No package here is named "nope"; write it as <ecosystem>:<name>, e.g. npm:nope.${USAGE}`,
    )
  })

  test('with the stack off, an ignored package or one not followed, no refresh is asked and the reply says why', async () => {
    const off = hostAt({}, { isEnabled: false })

    expect(await Commands.runNews(off.host, 'deps map react off', off.loop)).toEqual({
      text: 'npm:react reads its releases from its registry again.',
    })

    const ignored = hostAt({
      deps: {
        '/repo': { dependencies: [], ignored: ['npm:react'], detectedAt: 1 },
      },
    })

    expect(await Commands.runNews(ignored.host, 'deps map react off', ignored.loop)).toEqual({
      text: 'npm:react reads its releases from its registry again; it is ignored in /repo, /news deps unignore npm:react follows it.',
    })

    const added = hostAt({
      deps: {
        '/repo': { dependencies: [], added: [Fixtures.depAt('react')], detectedAt: 1 },
      },
    })

    expect(await Commands.runNews(added.host, 'deps map react off', added.loop)).toEqual({
      text: 'npm:react reads its releases from its registry again. It is not followed in /repo; /news deps add npm:react follows it.',
    })
  })

  test('the next refresh asks the registry again and reads its feed silently', async () => {
    const { host, web, fetched, stored, toasts, loop } = hostAt({
      deps: {
        '/repo': {
          settings: { toastLevel: 'all' },
          dependencies: [Fixtures.depAt('react', { versionInUse: '18.2.0' })],
          detectedAt: 1,
        },
      },
    })

    web.set(REGISTRY, { status: 200, text: '{"repository":"github:owner/react"}' })
    web.set(OWN, { status: 200, text: Feeds.releasesAtomOf('react', [['v19.0.0'], ['v18.2.0']]) })
    loop.isStarted = true

    const reply = await Commands.runNews(host, 'deps map react off', loop)

    expect(reply.refreshStack).toBe(true)

    await Stack.refreshStack(host, loop, Summaries.summaryJobsOf())

    // The registry's repository is checked for its feed, then the feed is read.
    expect(fetched).toEqual([REGISTRY, OWN, OWN])
    expect(Store.depFeedsOf(stored.get('depFeeds'))['npm:react']).toMatchObject({
      repo: 'owner/react',
      feed: OWN,
    })
    expect(Store.depFeedsOf(stored.get('depFeeds'))['npm:react']?.isOverride).toBeUndefined()
    expect(keptIn(stored, '/repo')).toContain('npm:react')
    expect(toasts).toEqual([])
  })

  test('the deps help lists the off target', async () => {
    const { host, loop } = hostAt()

    expect((await Commands.runNews(host, 'deps help', loop)).text).toContain(
      '/news deps map <package> <owner/repo|feed-url|off>',
    )
  })
})
