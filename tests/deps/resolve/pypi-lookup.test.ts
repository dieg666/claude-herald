import { describe, expect, test } from 'claude-code/testing'

import Resolve from '../../../hooks/deps/resolve'
import Fixtures from '../../fixtures'
import Registries from '../../fixtures/registries'

describe('pypi-lookup', () => {
  for (const [name, json, repo] of [
    ['requests', Registries.PYPI_REQUESTS, 'psf/requests'],
    ['textual', Registries.PYPI_TEXTUAL, 'Textualize/textual'],
    ['numpy', Registries.PYPI_NUMPY, 'numpy/numpy'],
    ['six', Registries.PYPI_SIX, 'benjaminp/six'],
    ['attrs', Registries.PYPI_ATTRS, 'python-attrs/attrs'],
  ] as const) {
    test(`${name}: the source among project_urls is ${repo}`, async () => {
      const { host, web, fetched } = Fixtures.fakeHostOf()

      web.set(`https://pypi.org/pypi/${name}/json`, { status: 200, text: json })

      expect(
        await Resolve.pypiLookup(
          url => Resolve.fetchGently(host, url),
          Fixtures.depAt(name, { ecosystem: 'pypi' }),
        ),
      ).toEqual({ kind: 'repo', repo })
      expect(fetched).toEqual([`https://pypi.org/pypi/${name}/json`])
    })
  }

  test('a source label wins over a home page on GitHub listed first', async () => {
    const { host, web } = Fixtures.fakeHostOf()

    web.set('https://pypi.org/pypi/pkg/json', {
      status: 200,
      text: JSON.stringify({
        info: {
          home_page: 'https://github.com/old/home',
          project_urls: {
            Funding: 'https://github.com/sponsors/someone',
            Homepage: 'https://github.com/org/site',
            'Source Code': 'https://github.com/org/pkg',
          },
        },
      }),
    })

    expect(
      await Resolve.pypiLookup(
        url => Resolve.fetchGently(host, url),
        Fixtures.depAt('pkg', { ecosystem: 'pypi' }),
      ),
    ).toEqual({ kind: 'repo', repo: 'org/pkg' })
  })

  test('a project with no URLs is a definite none', async () => {
    const { host, web } = Fixtures.fakeHostOf()

    web.set('https://pypi.org/pypi/pkg/json', { status: 200, text: '{"info":{"home_page":null}}' })

    expect(
      await Resolve.pypiLookup(
        url => Resolve.fetchGently(host, url),
        Fixtures.depAt('pkg', { ecosystem: 'pypi' }),
      ),
    ).toEqual({ kind: 'none', reason: 'no repository in the registry metadata' })
  })
})
