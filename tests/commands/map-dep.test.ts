import { describe, expect, mock, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'
import Stack from '../../hooks/deps/stack'
import Store from '../../hooks/store'
import Summaries from '../../hooks/summaries'
import Fixtures from '../fixtures'
import Feeds from '../fixtures/feeds'

describe('map-dep', () => {
  const SAMPLE = Fixtures.STACK_SAMPLE

  const peeked = (text: string | undefined) =>
    JSON.parse(text ?? 'null') as { stack: { items: { release: { name: string } }[] } }

  test(
    'maps a followed package to a repository, dropping the releases kept from its old feed so the new one starts silent',
    { plugins: [Fixtures.STACK_PEEK] },
    async ($, on) => {
      mock.clock(on)

      const stored = Fixtures.storeOn(on, {
        sources: [],
        ...Fixtures.stackStoreOf(SAMPLE, { showLevel: 'all' }),
      })

      Fixtures.fsOn(on, Fixtures.stackTreeOf(SAMPLE))

      expect((await $.command.run(Fixtures.newsOf('deps map react facebook/react'))).text).toBe(
        'npm:react now reads its releases from facebook/react.',
      )
      expect(Store.depFeedsOf(stored.get('depFeeds'))['npm:react']).toEqual({
        repo: 'facebook/react',
        resolvedAt: expect.any(Number),
        isOverride: true,
      })
      expect(
        Object.keys(
          Store.stackProjectOf((stored.get('stack') as Record<string, unknown>)['/repo']).deps,
        ),
      ).not.toContain('npm:react')
      expect(
        peeked((await $.command.run(Fixtures.PEEK_STACK)).text).stack.items.map(
          item => item.release.name,
        ),
      ).not.toContain('react')
    },
  )

  test('a feed URL is kept as the feed; a package not followed here is mapped and the reply says how to follow it', async ($, on) => {
    mock.clock(on)

    const stored = Fixtures.storeOn(on, { sources: [] })

    Fixtures.fsOn(on, { '.git': { isDir: true } })

    expect(
      (await $.command.run(Fixtures.newsOf('deps map pypi:requests https://example.org/r.xml')))
        .text,
    ).toBe(
      'pypi:requests now reads its releases from https://example.org/r.xml. It is not followed in /repo; /news deps add pypi:requests follows it.',
    )
    expect(Store.depFeedsOf(stored.get('depFeeds'))['pypi:requests']).toMatchObject({
      feed: 'https://example.org/r.xml',
      isOverride: true,
    })
  })

  test('an ignored package can be mapped; unignoring it later keeps the mapping', async ($, on) => {
    mock.clock(on)

    const stored = Fixtures.storeOn(on, {
      sources: [],
      deps: { '/repo': { ignored: ['npm:zod'] } },
    })

    Fixtures.fsOn(on, { '.git': { isDir: true } })

    expect((await $.command.run(Fixtures.newsOf('deps map zod colinhacks/zod'))).text).toBe(
      'npm:zod now reads its releases from colinhacks/zod; it is ignored in /repo, /news deps unignore npm:zod follows it.',
    )

    await $.command.run(Fixtures.newsOf('deps unignore zod'))

    expect(Store.depFeedsOf(stored.get('depFeeds'))['npm:zod']).toMatchObject({
      repo: 'colinhacks/zod',
      isOverride: true,
    })
  })

  test('mapped while a refresh reads the old feed: nothing of that read is kept or toasted', async () => {
    const NOW = 1_000_000_000
    const OLD = 'https://github.com/owner/react/releases.atom'
    const clocked = Fixtures.clockedHostOf(
      {
        deps: {
          '/repo': {
            settings: { toastLevel: 'all' },
            dependencies: [Fixtures.depAt('react', { versionInUse: '18.2.0' })],
            detectedAt: 1,
          },
        },
        depFeeds: { 'npm:react': { repo: 'owner/react', feed: OLD, resolvedAt: NOW } },
        stack: {
          '/repo': {
            deps: { 'npm:react': { checkedAt: 1, seen: ['npm:react|old'], items: [] } },
            refreshedAt: 1,
          },
        },
      },
      NOW,
    )
    const { host, toasts, stored, clock } = clocked
    const loop = Stack.stackLoopOf()
    let release = () => {}
    const held = new Promise<void>(resolve => {
      release = resolve
    })

    Object.assign(host, Fixtures.fakeFsOf('/repo', { '.git': { isDir: true } }))
    host.httpFetch = async () => {
      await held

      return { status: 200, ok: true, text: Feeds.releasesAtomOf('react', [['v19.0.0']]) }
    }
    loop.isStarted = true

    const running = Stack.refreshStack(host, loop, Summaries.summaryJobsOf())

    await clock.settle()

    const reply = await Commands.runNews(host, 'deps map react other/react', loop)

    release()
    await running

    expect(reply.text).toBe('npm:react now reads its releases from other/react.')
    expect(toasts).toEqual([])
    expect(
      Store.stackProjectOf((stored.get('stack') as Record<string, unknown>)['/repo']).deps,
    ).toEqual({})
  })

  test("mapped while a refresh writes its read: the drop waits for that write, so the old feed's read does not come back", async () => {
    const NOW = 1_000_000_000
    const OLD = 'https://github.com/owner/react/releases.atom'
    const clocked = Fixtures.clockedHostOf(
      {
        deps: {
          '/repo': {
            dependencies: [Fixtures.depAt('react', { versionInUse: '18.2.0' })],
            detectedAt: 1,
          },
        },
        depFeeds: { 'npm:react': { repo: 'owner/react', feed: OLD, resolvedAt: NOW } },
        stack: { '/repo': { deps: { 'npm:react': { checkedAt: 1, seen: [], items: [] } } } },
      },
      NOW,
    )
    const { host, web, stored, clock } = clocked
    const loop = Stack.stackLoopOf()
    const storeSet = host.storeSet
    let isHeld = true
    let release = () => {}
    const held = new Promise<void>(resolve => {
      release = resolve
    })

    Object.assign(host, Fixtures.fakeFsOf('/repo', { '.git': { isDir: true } }))
    host.storeSet = async (key, value) => {
      if (key === 'stack' && isHeld) {
        isHeld = false
        await held
      }

      return storeSet(key, value)
    }
    web.set(OLD, { status: 200, text: Feeds.releasesAtomOf('react', [['v19.0.0']]) })
    loop.isStarted = true

    const running = Stack.refreshStack(host, loop, Summaries.summaryJobsOf())

    await clock.settle()

    const mapping = Commands.runNews(host, 'deps map react other/react', loop)

    await clock.settle()
    release()
    await running
    await mapping

    expect(
      Store.stackProjectOf((stored.get('stack') as Record<string, unknown>)['/repo']).deps,
    ).toEqual({})
  })

  test('names with spaces are refused with the usage line', async ($, on) => {
    mock.clock(on)

    const stored = Fixtures.storeOn(on, { sources: [] })

    Fixtures.fsOn(on, { '.git': { isDir: true } })

    for (const args of ['"npm:zod extra" colinhacks/zod', 'npm:zod "a/b c"', 'npm:zod a/b extra']) {
      expect((await $.command.run(Fixtures.newsOf(`deps map ${args}`))).text).toBe(
        'Name the package, then where its releases are, each without spaces.\nUsage: /news deps map <package> <owner/repo|feed-url>',
      )
    }

    expect(stored.has('depFeeds')).toBe(false)
  })

  test('a target that is neither a repository nor a feed URL, or a missing one, is refused with the usage line', async ($, on) => {
    mock.clock(on)

    const stored = Fixtures.storeOn(on, {
      sources: [],
      deps: { '/repo': { dependencies: [Fixtures.depAt('zod')] } },
    })

    Fixtures.fsOn(on, { '.git': { isDir: true } })

    const usage = '\nUsage: /news deps map <package> <owner/repo|feed-url>'

    expect((await $.command.run(Fixtures.newsOf('deps map zod nowhere'))).text).toBe(
      `"nowhere" is neither a GitHub repository (owner/repo or its URL) nor a feed URL.${usage}`,
    )
    expect((await $.command.run(Fixtures.newsOf('deps map zod'))).text).toBe(
      `Name the package, then where its releases are, each without spaces.${usage}`,
    )
    expect((await $.command.run(Fixtures.newsOf('deps map nope a/b'))).text).toBe(
      `No package here is named "nope"; write it as <ecosystem>:<name>, e.g. npm:nope.${usage}`,
    )
    expect(stored.has('depFeeds')).toBe(false)
  })
})
