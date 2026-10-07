import { describe, expect, test } from 'claude-code/testing'

import Resolve from '../../../hooks/deps/resolve'
import Fixtures from '../../fixtures'
import Registries from '../../fixtures/registries'

describe('cargo-lookup', () => {
  test("reads the crate's repository, sending the descriptive User-Agent", async () => {
    const { host, web, fetched, headers } = Fixtures.fakeHostOf()

    web.set('https://crates.io/api/v1/crates/serde', { status: 200, text: Registries.CRATES_SERDE })

    expect(
      await Resolve.cargoLookup(
        url => Resolve.fetchGently(host, url),
        Fixtures.depAt('serde', { ecosystem: 'cargo' }),
      ),
    ).toEqual({ kind: 'repo', repo: 'serde-rs/serde' })
    expect(fetched).toEqual(['https://crates.io/api/v1/crates/serde'])
    expect(headers).toEqual([{ 'User-Agent': Resolve.RESOLVE_USER_AGENT }])
    expect(Resolve.RESOLVE_USER_AGENT).toContain('release feeds')
  })

  test('a body that is not JSON is a failure to retry, not a definite none', async () => {
    const { host, web } = Fixtures.fakeHostOf()

    web.set('https://crates.io/api/v1/crates/serde', { status: 200, text: '<html>' })

    expect(
      (
        await Resolve.cargoLookup(
          url => Resolve.fetchGently(host, url),
          Fixtures.depAt('serde', { ecosystem: 'cargo' }),
        )
      ).kind,
    ).toBe('failed')
  })
})
