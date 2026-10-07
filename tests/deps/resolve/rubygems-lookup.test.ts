import { describe, expect, test } from 'claude-code/testing'

import Resolve from '../../../hooks/deps/resolve'
import Fixtures from '../../fixtures'
import Registries from '../../fixtures/registries'

describe('rubygems-lookup', () => {
  for (const [name, json, repo] of [
    ['rails', Registries.RUBYGEMS_RAILS, 'rails/rails'],
    ['nokogiri', Registries.RUBYGEMS_NOKOGIRI, 'sparklemotion/nokogiri'],
  ] as const) {
    test(`${name}: source_code_uri is ${repo}, a tree/ path dropped`, async () => {
      const { host, web, fetched } = Fixtures.fakeHostOf()

      web.set(`https://rubygems.org/api/v1/gems/${name}.json`, { status: 200, text: json })

      expect(
        await Resolve.rubygemsLookup(
          url => Resolve.fetchGently(host, url),
          Fixtures.depAt(name, { ecosystem: 'rubygems' }),
        ),
      ).toEqual({ kind: 'repo', repo })
      expect(fetched).toEqual([`https://rubygems.org/api/v1/gems/${name}.json`])
    })
  }
})
