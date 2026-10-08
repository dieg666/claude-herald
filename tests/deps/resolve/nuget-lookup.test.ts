import { describe, expect, test } from 'claude-code/testing'

import Resolve from '../../../hooks/deps/resolve'
import Fixtures from '../../fixtures'
import Registries from '../../fixtures/registries'

describe('nuget-lookup', () => {
  const BASE = 'https://api.nuget.org/v3-flatcontainer/newtonsoft.json'

  test("reads the nuspec's repository url for the version in use", async () => {
    const { host, web, fetched } = Fixtures.fakeHostOf()

    web.set(`${BASE}/13.0.3/newtonsoft.json.nuspec`, {
      status: 200,
      text: Registries.NUGET_NEWTONSOFT_JSON_NUSPEC,
    })

    expect(
      await Resolve.nugetLookup(
        url => Resolve.fetchGently(host, url),
        Fixtures.depAt('Newtonsoft.Json', { ecosystem: 'nuget', versionInUse: '13.0.3' }),
      ),
    ).toEqual({ kind: 'repo', repo: 'JamesNK/Newtonsoft.Json' })
    expect(fetched).toEqual([`${BASE}/13.0.3/newtonsoft.json.nuspec`])
  })

  test('without an exact version in use, reads the newest stable version the list names', async () => {
    const { host, web, fetched } = Fixtures.fakeHostOf()

    web.set(`${BASE}/index.json`, { status: 200, text: Registries.NUGET_NEWTONSOFT_JSON_VERSIONS })
    web.set(`${BASE}/13.0.4/newtonsoft.json.nuspec`, {
      status: 200,
      text: Registries.NUGET_NEWTONSOFT_JSON_NUSPEC,
    })

    expect(
      await Resolve.nugetLookup(
        url => Resolve.fetchGently(host, url),
        Fixtures.depAt('Newtonsoft.Json', { ecosystem: 'nuget', range: '[13.0,14.0)' }),
      ),
    ).toEqual({ kind: 'repo', repo: 'JamesNK/Newtonsoft.Json' })
    expect(fetched).toEqual([`${BASE}/index.json`, `${BASE}/13.0.4/newtonsoft.json.nuspec`])
  })

  test('a nuspec with only a projectUrl off GitHub is a definite none', async () => {
    const { host, web } = Fixtures.fakeHostOf()

    web.set(`${BASE}/13.0.3/newtonsoft.json.nuspec`, {
      status: 200,
      text: '<package><metadata><projectUrl>https://www.newtonsoft.com/json</projectUrl></metadata></package>',
    })

    expect(
      await Resolve.nugetLookup(
        url => Resolve.fetchGently(host, url),
        Fixtures.depAt('Newtonsoft.Json', { ecosystem: 'nuget', versionInUse: '13.0.3' }),
      ),
    ).toEqual({ kind: 'none', reason: 'repository not on GitHub: https://www.newtonsoft.com/json' })
  })

  test('a name that could change the path or query is refused with no request', async () => {
    for (const name of ['Newtonsoft?x=1', 'News#oft', '../x', '..', 'a/b', 'New tonsoft']) {
      const { host, fetched } = Fixtures.fakeHostOf()

      expect(
        await Resolve.nugetLookup(
          url => Resolve.fetchGently(host, url),
          Fixtures.depAt(name, { ecosystem: 'nuget' }),
        ),
      ).toEqual({ kind: 'none', reason: 'not a valid nuget name' })
      expect(fetched).toEqual([])
    }
  })
})
