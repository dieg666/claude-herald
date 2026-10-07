import { describe, expect, test } from 'claude-code/testing'

import Resolve from '../../../hooks/deps/resolve'
import Fixtures from '../../fixtures'
import Registries from '../../fixtures/registries'

describe('npm-lookup', () => {
  test('reads repository.url from the latest version and drops git+, .git and the directory', async () => {
    const { host, web, fetched } = Fixtures.fakeHostOf()

    web.set('https://registry.npmjs.org/react/latest', {
      status: 200,
      text: Registries.NPM_REACT_LATEST,
    })

    expect(
      await Resolve.npmLookup(url => Resolve.fetchGently(host, url), Fixtures.depAt('react')),
    ).toEqual({ kind: 'repo', repo: 'react/react' })
    expect(fetched).toEqual(['https://registry.npmjs.org/react/latest'])
  })

  test("a scoped name's slash is encoded in the registry URL", async () => {
    const { host, web, fetched } = Fixtures.fakeHostOf()

    web.set('https://registry.npmjs.org/@vue%2Fcompiler-sfc/latest', {
      status: 200,
      text: Registries.NPM_VUE_COMPILER_SFC_LATEST,
    })

    expect(
      await Resolve.npmLookup(
        url => Resolve.fetchGently(host, url),
        Fixtures.depAt('@vue/compiler-sfc'),
      ),
    ).toEqual({ kind: 'repo', repo: 'vuejs/core' })
    expect(fetched).toEqual(['https://registry.npmjs.org/@vue%2Fcompiler-sfc/latest'])
  })

  for (const [repository, repo] of [
    ['"github:owner/repo"', 'owner/repo'],
    ['"owner/repo"', 'owner/repo'],
    ['{ "url": "git@github.com:Owner/Repo.git" }', 'Owner/Repo'],
  ] as const) {
    test(`the repository field ${repository} is ${repo}`, async () => {
      const { host, web } = Fixtures.fakeHostOf()

      web.set('https://registry.npmjs.org/pkg/latest', {
        status: 200,
        text: `{ "name": "pkg", "repository": ${repository} }`,
      })

      expect(
        await Resolve.npmLookup(url => Resolve.fetchGently(host, url), Fixtures.depAt('pkg')),
      ).toEqual({ kind: 'repo', repo })
    })
  }

  test('a repository off GitHub is a definite none naming it', async () => {
    const { host, web } = Fixtures.fakeHostOf()

    web.set('https://registry.npmjs.org/pkg/latest', {
      status: 200,
      text: '{ "repository": "gitlab:owner/repo", "homepage": "https://pkg.example.com" }',
    })

    expect(
      await Resolve.npmLookup(url => Resolve.fetchGently(host, url), Fixtures.depAt('pkg')),
    ).toEqual({ kind: 'none', reason: 'repository not on GitHub: gitlab:owner/repo' })
  })

  test('an unknown package and a name that is not one make a definite none', async () => {
    const { host, web, fetched } = Fixtures.fakeHostOf()

    web.set('https://registry.npmjs.org/gone/latest', { status: 404, text: '{}' })

    const get = (url: string) => Resolve.fetchGently(host, url)

    expect(await Resolve.npmLookup(get, Fixtures.depAt('gone'))).toEqual({
      kind: 'none',
      reason: 'not found in the registry (HTTP 404)',
    })
    expect((await Resolve.npmLookup(get, Fixtures.depAt('../x'))).kind).toBe('none')
    expect(fetched).toEqual(['https://registry.npmjs.org/gone/latest'])
  })
})
