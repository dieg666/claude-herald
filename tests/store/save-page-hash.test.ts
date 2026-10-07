import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('save-page-hash', () => {
  test("records one page's hash and keeps the others", async () => {
    const { host } = Fixtures.fakeHostOf({ pageHashes: { other: 'h1', broken: 3 } })

    await Store.savePageHash(host, 'anthropic-news', 'h2')

    expect(await Store.loadPageHashes(host)).toEqual({ other: 'h1', 'anthropic-news': 'h2' })
  })
})
