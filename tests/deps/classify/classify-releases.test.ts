import { describe, expect, test } from 'claude-code/testing'

import Classify from '../../../hooks/deps/classify'
import Feed from '../../../hooks/feed'
import type { Dependency } from '../../../types/index.js'
import Fixtures from '../../fixtures'
import Feeds from '../../fixtures/feeds'

/**
 * The entries of a feed sample.
 *
 * @param xml the feed
 */
function entriesOf(xml: string): readonly Feed.ParsedEntry[] {
  const result = Feed.parseFeed(xml)

  if (!result.ok) {
    throw new Error(`expected a feed, got ${result.reason}`)
  }

  return result.feed.entries
}

/**
 * A dependency of an ecosystem.
 *
 * @param ecosystem its registry
 * @param name its name
 * @param fields what else it has
 */
function depOf(
  ecosystem: Dependency['ecosystem'],
  name: string,
  fields: Partial<Dependency> = {},
): Dependency {
  return Fixtures.depAt(name, { ecosystem, ...fields })
}

/**
 * The version and level of each release, in order.
 *
 * @param releases what classification kept
 */
function levelsOf(releases: readonly Classify.ClassifiedRelease[]) {
  return releases.map(release => [release.version, release.level])
}

describe('classify-releases', () => {
  test('a real PyPI release feed: releases at or below the version in use are hidden', () => {
    const sdk = depOf('pypi', 'anthropic', { versionInUse: '1.10.0' })
    const releases = Classify.classifyReleases(sdk, entriesOf(Feeds.ANTHROPIC_SDK_PYTHON_RELEASES))

    expect(levelsOf(releases)).toEqual([
      ['v1.12.0', 'minor'],
      ['v1.11.0', 'minor'],
    ])
    expect(releases[0]).toMatchObject({
      id: 'pypi:anthropic|tag:github.com,2008:Repository/590187800/v1.12.0',
      current: '1.10.0',
      isPrerelease: false,
      title: 'v1.12.0',
      url: 'https://github.com/anthropics/anthropic-sdk-python/releases/tag/v1.12.0',
      publishedAt: '2026-10-07T17:57:07.000Z',
    })
    expect(releases[0]?.notes).toContain('claude-haiku-5-5')
  })

  test('a real npm release feed at 0.x: patches stay patches', () => {
    const sdk = depOf('npm', '@anthropic-ai/claude-agent-sdk', { versionInUse: '0.3.291' })
    const releases = Classify.classifyReleases(sdk, entriesOf(Feeds.AGENT_SDK_TS_RELEASES))

    expect(levelsOf(releases)).toEqual([
      ['v0.3.293', 'patch'],
      ['v0.3.292', 'patch'],
    ])
  })

  test('a real dated release feed: dates compare, a candidate is a pre-release', () => {
    const spec = depOf('npm', '@modelcontextprotocol/spec', { versionInUse: '2025-11-25' })
    const releases = Classify.classifyReleases(spec, entriesOf(Feeds.MCP_SPEC_RELEASES))

    expect(levelsOf(releases)).toEqual([
      ['2026-07-28', 'major'],
      ['2026-07-28-RC', 'major'],
    ])
    expect(releases.map(release => release.isPrerelease)).toEqual([false, true])
  })

  test('the version in use itself, with or without v, is hidden', () => {
    const cli = depOf('npm', '@anthropic-ai/claude-code', { versionInUse: '2.1.293' })

    expect(Classify.classifyReleases(cli, entriesOf(Feeds.CLAUDE_CODE_RELEASES))).toEqual([])
  })

  test('1.10.0 is newer than 1.9.0, and a pre-release older than its final release', () => {
    const dep = depOf('cargo', 'serde', { versionInUse: '2.0.0-rc.1' })
    const entries = ['v1.10.0', 'v2.0.0', 'v2.0.0-rc.2', 'v2.0.0-rc.1', 'v1.9.0'].map(tag =>
      Fixtures.releaseAt(tag),
    )

    expect(levelsOf(Classify.classifyReleases(dep, entries))).toEqual([
      ['v2.0.0', 'patch'],
      ['v2.0.0-rc.2', 'patch'],
    ])
    expect(levelsOf(Classify.classifyReleases({ ...dep, versionInUse: '1.9.0' }, entries))).toEqual(
      [
        ['v1.10.0', 'minor'],
        ['v2.0.0', 'major'],
        ['v2.0.0-rc.2', 'major'],
        ['v2.0.0-rc.1', 'major'],
      ],
    )
  })

  test('a 0.x minor bump is major', () => {
    const dep = depOf('npm', 'zod', { versionInUse: '0.3.1' })
    const entries = ['v0.4.0', 'v0.3.2'].map(tag => Fixtures.releaseAt(tag))

    expect(levelsOf(Classify.classifyReleases(dep, entries))).toEqual([
      ['v0.4.0', 'major'],
      ['v0.3.2', 'patch'],
    ])
  })

  test('without a version in use, the floor of the range is compared', () => {
    const dep = depOf('npm', 'zod', { range: '^0.3.1' })
    const releases = Classify.classifyReleases(dep, [
      Fixtures.releaseAt('v0.3.1'),
      Fixtures.releaseAt('v0.3.5'),
    ])

    expect(levelsOf(releases)).toEqual([['v0.3.5', 'patch']])
    expect(releases[0]?.current).toBe('0.3.1')
  })

  test('PEP 440, Maven and Go forms in use', () => {
    const pydantic = depOf('pypi', 'pydantic', { versionInUse: '2.0b3' })
    const spring = depOf('maven', 'org.springframework:spring-core', {
      versionInUse: '6.1.0-SNAPSHOT',
    })
    const yaml = depOf('go', 'gopkg.in/yaml.v3', { versionInUse: 'v3.0.1' })

    expect(
      levelsOf(
        Classify.classifyReleases(
          pydantic,
          ['v2.0', 'v2.0b3', 'v2.0b2', 'v2.0.post1', 'v1.10.13'].map(tag =>
            Fixtures.releaseAt(tag),
          ),
        ),
      ),
    ).toEqual([
      ['v2.0', 'patch'],
      ['v2.0.post1', 'patch'],
    ])
    expect(
      levelsOf(
        Classify.classifyReleases(
          spring,
          ['v6.1.0', 'v6.0.9', 'v6.1.0-RC1'].map(tag => Fixtures.releaseAt(tag)),
        ),
      ),
    ).toEqual([['v6.1.0', 'patch']])
    expect(
      levelsOf(
        Classify.classifyReleases(
          yaml,
          ['v3.0.1', 'v3.1.0', 'v2.4.0'].map(tag => Fixtures.releaseAt(tag)),
        ),
      ),
    ).toEqual([['v3.1.0', 'minor']])
  })

  test('Go: a v2 module hides v1 releases, a v1 module sees v2 as major', () => {
    const entries = ['v2.1.0', 'v2.0.0', 'v1.9.0'].map(tag => Fixtures.releaseAt(tag))
    const v1 = depOf('go', 'github.com/acme/kit', { versionInUse: 'v1.8.0' })
    const v2 = depOf('go', 'github.com/acme/kit/v2', { versionInUse: 'v2.0.0' })

    expect(levelsOf(Classify.classifyReleases(v1, entries))).toEqual([
      ['v2.1.0', 'major'],
      ['v2.0.0', 'major'],
      ['v1.9.0', 'minor'],
    ])
    expect(levelsOf(Classify.classifyReleases(v2, entries))).toEqual([['v2.1.0', 'minor']])
  })

  test('monorepo tags: only the entries whose tag names the package are taken', () => {
    const entries = [
      '@scope/pkg@1.3.0',
      '@scope/other@9.0.0',
      'tokio-macros-2.2.0',
      'go/v1.9.0',
      'v1.4.0',
    ].map(tag => Fixtures.releaseAt(tag))
    const pkg = depOf('npm', '@scope/pkg', { versionInUse: '1.2.0' })
    const goClient = depOf('go', 'github.com/scope/mono/go', { versionInUse: 'v1.0.0' })

    expect(levelsOf(Classify.classifyReleases(pkg, entries))).toEqual([
      ['1.3.0', 'minor'],
      ['v1.4.0', 'minor'],
    ])
    expect(levelsOf(Classify.classifyReleases(goClient, entries))).toEqual([
      ['v1.9.0', 'minor'],
      ['v1.4.0', 'minor'],
    ])
  })

  test('the tag decides over the title, and the title serves when there is no tag', () => {
    const dep = depOf('cargo', 'tokio', { versionInUse: '1.30.0' })
    const titled = Fixtures.releaseAt('tokio-macros-2.2.0', undefined, 'Tokio v1.99.0')
    const plain = { guid: 'urn:1', title: 'Release 1.31.0: faster timers' }

    expect(levelsOf(Classify.classifyReleases(dep, [titled, plain]))).toEqual([['1.31.0', 'minor']])
  })

  test('an unparseable version in use leaves every release unknown and none hidden', () => {
    const dep = depOf('npm', 'left-pad', { versionInUse: 'github:o/r#abc', range: '^1.0.0' })
    const entries = ['v0.9.0', 'v1.0.0', 'v2.0.0'].map(tag => Fixtures.releaseAt(tag))
    const releases = Classify.classifyReleases(dep, entries)

    expect(levelsOf(releases)).toEqual([
      ['v0.9.0', 'unknown'],
      ['v1.0.0', 'unknown'],
      ['v2.0.0', 'unknown'],
    ])
    expect(releases[0]?.current).toBe('github:o/r#abc')
  })

  test('no version in use nor range: unknown; a release naming no version: unknown, kept', () => {
    const bare = depOf('npm', 'left-pad')
    const dep = depOf('npm', 'left-pad', { versionInUse: '1.0.0' })
    const prose = { guid: 'urn:2', title: 'Spring cleaning' }

    expect(levelsOf(Classify.classifyReleases(bare, [Fixtures.releaseAt('v1.0.0')]))).toEqual([
      ['v1.0.0', 'unknown'],
    ])
    expect(Classify.classifyReleases(dep, [prose])).toMatchObject([
      { level: 'unknown', title: 'Spring cleaning', id: 'npm:left-pad|urn:2' },
    ])
    expect(Classify.classifyReleases(dep, [prose])[0]?.version).toBeUndefined()
  })

  test('keyword flags come from the title and the notes body', () => {
    const dep = depOf('npm', 'next', { versionInUse: '14.0.0' })
    const releases = Classify.classifyReleases(dep, [
      Fixtures.releaseAt('v14.0.1', 'Bug fixes. Patches CVE-2024-34351 in image optimization.'),
      Fixtures.releaseAt('v15.0.0', 'See the upgrade guide.', 'v15.0.0 (BREAKING CHANGE)'),
      Fixtures.releaseAt('v14.0.2', 'No breaking changes. Securityscorecard badge.'),
    ])

    expect(releases.map(release => release.flags)).toEqual([
      { breaking: false, security: true },
      { breaking: true, security: false },
      { breaking: false, security: false },
    ])
  })

  test('Maven flavours compare as their version: another flavour of the version in use is hidden', () => {
    const guava = depOf('maven', 'com.google.guava:guava', { versionInUse: '32.1.3-jre' })
    const entries = ['v32.1.3-android', 'v32.1.3', 'v33.0.0-android', 'v33.0.0-jre'].map(tag =>
      Fixtures.releaseAt(tag),
    )

    expect(levelsOf(Classify.classifyReleases(guava, entries))).toEqual([
      ['v33.0.0-android', 'major'],
      ['v33.0.0-jre', 'major'],
    ])
  })

  test('a title-only entry naming a bare number has no version and stays unknown', () => {
    const dep = depOf('npm', 'left-pad', { versionInUse: '13.0.0' })

    expect(
      levelsOf(Classify.classifyReleases(dep, [{ guid: 'urn:3', title: 'Weekly update 12' }])),
    ).toEqual([[undefined, 'unknown']])
  })

  test('an npm lockfile alias is compared by its aliased version', () => {
    const dep = depOf('npm', 'other', { versionInUse: 'npm:other@1.5.0' })

    expect(
      levelsOf(
        Classify.classifyReleases(
          dep,
          ['v1.5.0', 'v1.6.0'].map(tag => Fixtures.releaseAt(tag)),
        ),
      ),
    ).toEqual([['v1.6.0', 'minor']])
  })
})
