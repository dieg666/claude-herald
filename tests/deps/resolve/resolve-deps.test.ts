import { describe, expect, test } from 'claude-code/testing'

import type { Dependency } from '../../../types/index.js'
import Resolve from '../../../hooks/deps/resolve'
import Fixtures from '../../fixtures'
import Feeds from '../../fixtures/feeds'
import Registries from '../../fixtures/registries'

describe('resolve-deps', () => {
  const DAY = 24 * 60 * 60_000
  const TTL = Resolve.RESOLVE_LIMITS.ttlMs
  const NOW = 100 * DAY
  const REQUESTS = 'https://pypi.org/pypi/requests/json'
  const PSF_RELEASES = 'https://github.com/psf/requests/releases.atom'
  const requests = Fixtures.depAt('requests', { ecosystem: 'pypi', manifestPath: 'pyproject.toml' })

  /** A host on a clock at NOW whose web answers the requests package and its releases. */
  const hostAt = (entries: Readonly<Record<string, unknown>> = {}) => {
    const clocked = Fixtures.clockedHostOf(entries, NOW)

    clocked.web.set(REQUESTS, { status: 200, text: Registries.PYPI_REQUESTS })
    clocked.web.set(PSF_RELEASES, { status: 200, text: Feeds.MCP_SPEC_RELEASES })

    return clocked
  }

  test('resolves a package through its registry and GitHub, and caches the mapping', async () => {
    const { host, fetched, stored } = hostAt()

    expect(await Resolve.resolveDeps(host, [requests])).toEqual([
      {
        dependency: requests,
        status: 'resolved',
        repo: 'psf/requests',
        feed: PSF_RELEASES,
        isOverride: false,
      },
    ])
    expect(fetched).toEqual([REQUESTS, PSF_RELEASES])
    expect(stored.get('depFeeds')).toEqual({
      'pypi:requests': { repo: 'psf/requests', feed: PSF_RELEASES, resolvedAt: NOW },
    })
  })

  test('a cached mapping inside the TTL makes no request and no write', async () => {
    const { host, fetched, sets } = hostAt({
      depFeeds: {
        'pypi:requests': { repo: 'psf/requests', feed: PSF_RELEASES, resolvedAt: NOW - TTL + 1 },
      },
    })

    const [resolution] = await Resolve.resolveDeps(host, [requests])

    expect(resolution?.feed).toBe(PSF_RELEASES)
    expect(fetched).toEqual([])
    expect(sets).toEqual([])
  })

  test('past the TTL the mapping is looked up again and restamped', async () => {
    const { host, fetched, stored } = hostAt({
      depFeeds: {
        'pypi:requests': { repo: 'old/name', feed: 'https://x', resolvedAt: NOW - TTL },
      },
    })

    const [resolution] = await Resolve.resolveDeps(host, [requests])

    expect(resolution?.repo).toBe('psf/requests')
    expect(fetched).toEqual([REQUESTS, PSF_RELEASES])
    expect(stored.get('depFeeds')).toEqual({
      'pypi:requests': { repo: 'psf/requests', feed: PSF_RELEASES, resolvedAt: NOW },
    })
  })

  test('a negative result is cached and answers without a request inside the TTL', async () => {
    const gitlab = Fixtures.depAt('pkg')
    const first = hostAt()

    first.web.set('https://registry.npmjs.org/pkg/latest', {
      status: 200,
      text: '{"repository":{"url":"https://gitlab.com/o/pkg.git"}}',
    })

    const unresolved = {
      dependency: gitlab,
      status: 'unresolved',
      reason: 'repository not on GitHub: https://gitlab.com/o/pkg.git',
      isOverride: false,
    }

    expect(await Resolve.resolveDeps(first.host, [gitlab])).toEqual([unresolved])

    const second = hostAt({ depFeeds: first.stored.get('depFeeds') })

    expect(await Resolve.resolveDeps(second.host, [gitlab])).toEqual([unresolved])
    expect(second.fetched).toEqual([])
  })

  test('a feed override wins over the registry and survives the TTL', async () => {
    const { host, fetched, sets } = hostAt({
      depFeeds: {
        'pypi:requests': { feed: 'https://example.com/feed.xml', resolvedAt: 0, isOverride: true },
      },
    })

    expect(await Resolve.resolveDeps(host, [requests])).toEqual([
      {
        dependency: requests,
        status: 'resolved',
        feed: 'https://example.com/feed.xml',
        isOverride: true,
      },
    ])
    expect(fetched).toEqual([])
    expect(sets).toEqual([])
  })

  test('a repository override skips the registry, checks the feed and stays an override', async () => {
    const { host, web, fetched, stored } = hostAt()

    await Resolve.setOverride(host, requests, 'fork/requests')
    web.set('https://github.com/fork/requests/releases.atom', {
      status: 200,
      text: Feeds.AWESOME_EMPTY_RELEASES,
    })

    const [resolution] = await Resolve.resolveDeps(host, [requests])

    expect(resolution).toEqual({
      dependency: requests,
      status: 'resolved',
      repo: 'fork/requests',
      feed: 'https://github.com/fork/requests/tags.atom',
      isOverride: true,
    })
    expect(fetched).toEqual(['https://github.com/fork/requests/releases.atom'])
    expect(stored.get('depFeeds')).toEqual({
      'pypi:requests': {
        repo: 'fork/requests',
        feed: 'https://github.com/fork/requests/tags.atom',
        resolvedAt: NOW,
        isOverride: true,
      },
    })
  })

  test('unresolvable packages are listed as unresolved with a reason, never an error', async () => {
    const swift = Fixtures.depAt('swift-log', {
      ecosystem: 'swift',
      source: 'https://example.com/x.git',
    })
    const pub = Fixtures.depAt('http', { ecosystem: 'pub' })
    const gone = Fixtures.depAt('gone', { ecosystem: 'cargo' })
    const { host, web } = hostAt()

    web.set('https://crates.io/api/v1/crates/gone', { status: 404, text: '{"errors":[]}' })

    const resolutions = await Resolve.resolveDeps(host, [swift, pub, gone])

    expect(resolutions.map(({ status, reason }) => ({ status, reason }))).toEqual([
      { status: 'unresolved', reason: 'repository not on GitHub: https://example.com/x.git' },
      { status: 'unresolved', reason: 'no registry lookup for pub' },
      { status: 'unresolved', reason: 'not found in the registry (HTTP 404)' },
    ])
  })

  test("a dependency's GitHub source resolves it without a registry request", async () => {
    const swift = Fixtures.depAt('swift-log', {
      ecosystem: 'swift',
      source: 'https://github.com/apple/swift-log.git',
    })
    const { host, web, fetched } = hostAt()

    web.set('https://github.com/apple/swift-log/releases.atom', {
      status: 200,
      text: Feeds.MCP_SPEC_RELEASES,
    })

    expect((await Resolve.resolveDeps(host, [swift]))[0]?.repo).toBe('apple/swift-log')
    expect(fetched).toEqual(['https://github.com/apple/swift-log/releases.atom'])
  })

  test('a store that fails still answers every package', async () => {
    const { host, logs } = hostAt()

    host.storeGet = async () => {
      throw new Error('store down')
    }

    expect(await Resolve.resolveDeps(host, [requests])).toEqual([
      { dependency: requests, status: 'unresolved', reason: 'store down', isOverride: false },
    ])
    expect(logs).toEqual(['herald: deps: resolution failed: store down'])
  })

  test('a failure worth retrying is not cached, and a stale feed is kept meanwhile', async () => {
    const stale = { repo: 'psf/requests', feed: PSF_RELEASES, resolvedAt: NOW - TTL - DAY }
    const { host, web, clock, sets, logs } = hostAt({ depFeeds: { 'pypi:requests': stale } })

    web.set(REQUESTS, { status: 503, text: '' })

    const pending = Resolve.resolveDeps(host, [requests])

    await clock.advance(60_000)

    expect(await pending).toEqual([
      {
        dependency: requests,
        status: 'resolved',
        repo: 'psf/requests',
        feed: PSF_RELEASES,
        isOverride: false,
      },
    ])
    expect(sets).toEqual([])
    expect(logs).toEqual(['herald: deps: could not resolve pypi:requests: HTTP 503'])
  })

  test('a 429 backs off on the clock and then resolves', async () => {
    const { host, clock, fetched } = hostAt()
    let answers = 0
    const fetch = host.httpFetch

    host.httpFetch = async (url, init) => {
      answers += 1

      return answers === 1 ? { status: 429, ok: false, text: '' } : fetch(url, init)
    }

    let resolutions: unknown

    void Resolve.resolveDeps(host, [requests]).then(value => {
      resolutions = value
    })

    await clock.advance(999)
    expect(resolutions).toBeUndefined()

    await clock.advance(1)
    expect(clock.waitsAsked().filter(ms => ms !== Resolve.RESOLVE_LIMITS.requestTimeoutMs)).toEqual(
      [1000],
    )
    expect(fetched).toEqual([REQUESTS, PSF_RELEASES])
    expect((resolutions as { status: string }[])[0]?.status).toBe('resolved')
  })

  test('packages sharing a repository, in any case, check its feed once', async () => {
    const { host, web, fetched } = hostAt()

    for (const [name, owner] of [
      ['@vue/compiler-sfc', 'vuejs'],
      ['@vue/runtime-core', 'VueJS'],
      ['@vue/shared', 'vuejs'],
    ] as const) {
      web.set(`https://registry.npmjs.org/${name.replace('/', '%2F')}/latest`, {
        status: 200,
        text: JSON.stringify({ repository: { url: `git+https://github.com/${owner}/core.git` } }),
      })
    }

    web.set('https://github.com/vuejs/core/releases.atom', {
      status: 200,
      text: Feeds.MCP_SPEC_RELEASES,
    })

    const resolutions = await Resolve.resolveDeps(host, [
      Fixtures.depAt('@vue/compiler-sfc'),
      Fixtures.depAt('@vue/runtime-core'),
      Fixtures.depAt('@vue/shared'),
    ])

    expect(resolutions.map(resolution => resolution.feed)).toEqual([
      'https://github.com/vuejs/core/releases.atom',
      'https://github.com/vuejs/core/releases.atom',
      'https://github.com/vuejs/core/releases.atom',
    ])
    expect(fetched.filter(url => url.startsWith('https://github.com/'))).toEqual([
      'https://github.com/vuejs/core/releases.atom',
    ])
  })

  test("a new package reuses another package's fresh feed for the same repository", async () => {
    const { host, web, fetched } = hostAt({
      depFeeds: {
        'npm:@vue/compiler-sfc': {
          repo: 'vuejs/core',
          feed: 'https://github.com/vuejs/core/releases.atom',
          resolvedAt: NOW - DAY,
        },
      },
    })

    web.set('https://registry.npmjs.org/@vue%2Fshared/latest', {
      status: 200,
      text: '{"repository":"github:vuejs/core"}',
    })

    expect((await Resolve.resolveDeps(host, [Fixtures.depAt('@vue/shared')]))[0]?.feed).toBe(
      'https://github.com/vuejs/core/releases.atom',
    )
    expect(fetched).toEqual(['https://registry.npmjs.org/@vue%2Fshared/latest'])
  })

  test('the same package declared twice is looked up once', async () => {
    const { host, fetched } = hostAt()

    const resolutions = await Resolve.resolveDeps(host, [
      requests,
      { ...requests, manifestPath: 'sub/pyproject.toml', isRoot: false },
    ])

    expect(resolutions.map(resolution => resolution.feed)).toEqual([PSF_RELEASES, PSF_RELEASES])
    expect(fetched).toEqual([REQUESTS, PSF_RELEASES])
  })

  test('never more than the concurrency limit of requests in flight', async () => {
    const { host } = Fixtures.fakeHostOf()
    const held: (() => void)[] = []
    let inFlight = 0
    let most = 0

    host.httpFetch = async url => {
      inFlight += 1
      most = Math.max(most, inFlight)
      await new Promise<void>(resolve => held.push(resolve))
      inFlight -= 1

      return url.endsWith('.atom')
        ? { status: 200, ok: true, text: Feeds.MCP_SPEC_RELEASES }
        : { status: 200, ok: true, text: '{"repository":"github:o/r"}' }
    }

    const names = ['a', 'b', 'c', 'd', 'e', 'f']
    const pending = Resolve.resolveDeps(
      host,
      names.map(name => Fixtures.depAt(name)),
    )
    const settle = async () => {
      for (let tick = 0; tick < 200; tick += 1) {
        await Promise.resolve()
      }
    }

    await settle()
    expect(inFlight).toBe(Resolve.RESOLVE_LIMITS.concurrentPackages)

    while (held.length > 0) {
      held.shift()?.()
      await settle()
    }

    expect((await pending).every(resolution => resolution.status === 'resolved')).toBe(true)
    expect(Resolve.RESOLVE_LIMITS.concurrentPackages).toBe(2)
    expect(most).toBe(2)
  })

  test('every host contacted for every ecosystem is in the declared list', async () => {
    const { host, web, fetched, clock } = hostAt()
    const answers: Record<string, string> = {
      'https://registry.npmjs.org/react/latest': Registries.NPM_REACT_LATEST,
      'https://crates.io/api/v1/crates/serde': Registries.CRATES_SERDE,
      'https://proxy.golang.org/k8s.io/client-go/@latest': Registries.GO_CLIENT_GO_LATEST,
      'https://proxy.golang.org/gopkg.in/yaml.v3/@latest': Registries.GO_YAML_V3_LATEST,
      'https://gopkg.in/yaml.v3?go-get=1': Registries.GOPKG_YAML_V3_META,
      'https://rubygems.org/api/v1/gems/rails.json': Registries.RUBYGEMS_RAILS,
      'https://repo.packagist.org/p2/monolog/monolog.json': Registries.PACKAGIST_MONOLOG,
      'https://api.nuget.org/v3-flatcontainer/newtonsoft.json/index.json':
        Registries.NUGET_NEWTONSOFT_JSON_VERSIONS,
      'https://api.nuget.org/v3-flatcontainer/newtonsoft.json/13.0.4/newtonsoft.json.nuspec':
        Registries.NUGET_NEWTONSOFT_JSON_NUSPEC,
      'https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-databind/maven-metadata.xml':
        Registries.MAVEN_JACKSON_DATABIND_METADATA,
      'https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-databind/2.22.3/jackson-databind-2.22.3.pom':
        Registries.MAVEN_JACKSON_DATABIND_POM,
    }

    for (const [url, text] of Object.entries(answers)) {
      web.set(url, { status: 200, text })
    }

    const deps: Dependency[] = [
      requests,
      Fixtures.depAt('react'),
      Fixtures.depAt('serde', { ecosystem: 'cargo' }),
      Fixtures.depAt('k8s.io/client-go', { ecosystem: 'go' }),
      Fixtures.depAt('gopkg.in/yaml.v3', { ecosystem: 'go' }),
      Fixtures.depAt('golang.org/x/net', { ecosystem: 'go' }),
      Fixtures.depAt('rails', { ecosystem: 'rubygems' }),
      Fixtures.depAt('monolog/monolog', { ecosystem: 'packagist' }),
      Fixtures.depAt('Newtonsoft.Json', { ecosystem: 'nuget' }),
      Fixtures.depAt('com.fasterxml.jackson.core:jackson-databind', { ecosystem: 'maven' }),
    ]
    const repos = [
      'psf/requests',
      'react/react',
      'serde-rs/serde',
      'kubernetes/client-go',
      'go-yaml/yaml',
      'golang/net',
      'rails/rails',
      'Seldaek/monolog',
      'JamesNK/Newtonsoft.Json',
      'FasterXML/jackson-databind',
    ]

    for (const repo of repos) {
      web.set(`https://github.com/${repo}/releases.atom`, {
        status: 200,
        text: Feeds.MCP_SPEC_RELEASES,
      })
    }

    const pending = Resolve.resolveDeps(host, deps)

    await clock.advance(10 * 60_000)

    const resolutions = await pending

    expect(resolutions.every(resolution => resolution.status === 'resolved')).toBe(true)
    expect(resolutions.map(resolution => resolution.repo)).toEqual(repos)
    expect(fetched.length).toBeGreaterThan(deps.length)

    for (const url of fetched) {
      expect(Resolve.RESOLVE_HOSTS).toContain(new URL(url).hostname)
    }
  })
})
