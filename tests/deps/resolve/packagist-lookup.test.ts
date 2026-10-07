import { describe, expect, test } from 'claude-code/testing'

import Resolve from '../../../hooks/deps/resolve'
import Fixtures from '../../fixtures'
import Registries from '../../fixtures/registries'

describe('packagist-lookup', () => {
  test("reads the newest version's source.url from the p2 metadata", async () => {
    const { host, web, fetched } = Fixtures.fakeHostOf()

    web.set('https://repo.packagist.org/p2/monolog/monolog.json', {
      status: 200,
      text: Registries.PACKAGIST_MONOLOG,
    })

    expect(
      await Resolve.packagistLookup(
        url => Resolve.fetchGently(host, url),
        Fixtures.depAt('monolog/monolog', { ecosystem: 'packagist' }),
      ),
    ).toEqual({ kind: 'repo', repo: 'Seldaek/monolog' })
    expect(fetched).toEqual(['https://repo.packagist.org/p2/monolog/monolog.json'])
  })

  test('a name without a vendor is a definite none, with no request', async () => {
    const { host, fetched } = Fixtures.fakeHostOf()

    expect(
      (
        await Resolve.packagistLookup(
          url => Resolve.fetchGently(host, url),
          Fixtures.depAt('monolog', { ecosystem: 'packagist' }),
        )
      ).kind,
    ).toBe('none')
    expect(fetched).toEqual([])
  })
})
