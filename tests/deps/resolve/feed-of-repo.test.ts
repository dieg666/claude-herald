import { describe, expect, test } from 'claude-code/testing'

import Resolve from '../../../hooks/deps/resolve'
import Fixtures from '../../fixtures'
import Feeds from '../../fixtures/feeds'

describe('feed-of-repo', () => {
  const RELEASES = 'https://github.com/o/r/releases.atom'

  test('a releases feed with entries is the feed', async () => {
    const { host, web, fetched } = Fixtures.fakeHostOf()

    web.set(RELEASES, { status: 200, text: Feeds.MCP_SPEC_RELEASES })

    expect(await Resolve.feedOfRepo(url => Resolve.fetchGently(host, url), 'o/r')).toEqual({
      kind: 'feed',
      feed: RELEASES,
    })
    expect(fetched).toEqual([RELEASES])
  })

  test('a releases feed with no entries falls back to tags.atom', async () => {
    const { host, web } = Fixtures.fakeHostOf()

    web.set(RELEASES, { status: 200, text: Feeds.AWESOME_EMPTY_RELEASES })

    expect(await Resolve.feedOfRepo(url => Resolve.fetchGently(host, url), 'o/r')).toEqual({
      kind: 'feed',
      feed: 'https://github.com/o/r/tags.atom',
    })
  })

  test('a missing repository is a definite none, an unreadable feed a failure', async () => {
    const { host, web } = Fixtures.fakeHostOf()
    const get = (url: string) => Resolve.fetchGently(host, url)

    web.set(RELEASES, { status: 404, text: 'Not Found' })
    expect(await Resolve.feedOfRepo(get, 'o/r')).toEqual({
      kind: 'none',
      reason: 'repository not found on GitHub: o/r',
    })

    web.set(RELEASES, { status: 200, text: '<html>rate limited</html>' })
    expect((await Resolve.feedOfRepo(get, 'o/r')).kind).toBe('failed')
  })
})
