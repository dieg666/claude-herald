import { describe, expect, test } from 'claude-code/testing'

import Feed from '../../hooks/feed'
import Refresh from '../../hooks/refresh'
import Fixtures from '../fixtures'
import Feeds from '../fixtures/feeds'
import Pages from '../fixtures/pages'

describe('fetch-feed', () => {
  const PRIMARY = 'https://hnrss.org/frontpage'
  const FALLBACK = 'https://news.ycombinator.com/rss'
  const SOURCE = Fixtures.sourceAt('hn', { url: PRIMARY, fallbackUrl: FALLBACK })

  const itemsOf = (xml: string, url: string) => {
    const parsed = Feed.parseFeed(xml, url)

    return parsed.ok ? Refresh.itemsOfFeed('hn', parsed.feed) : []
  }

  test('reads the main address and never the fallback when it works', async () => {
    const { host, web, fetched } = Fixtures.fakeHostOf()

    web.set(PRIMARY, { status: 200, text: Feeds.HNRSS_FRONTPAGE })
    web.set(FALLBACK, { status: 200, text: Feeds.HN_RSS })

    expect(await Refresh.fetchFeed(host, SOURCE)).toEqual({
      kind: 'items',
      items: itemsOf(Feeds.HNRSS_FRONTPAGE, PRIMARY),
    })
    expect(fetched).toEqual([PRIMARY])
  })

  for (const [why, page] of [
    ['a network error', new Error('connection reset')],
    ['a non-2xx status', { status: 503, text: Feeds.HNRSS_FRONTPAGE }],
    ['a body that is not a feed', { status: 200, text: Feeds.HTML_PAGE }],
  ] as const) {
    test(`falls back on ${why}`, async () => {
      const { host, web, fetched } = Fixtures.fakeHostOf()

      web.set(PRIMARY, page)
      web.set(FALLBACK, { status: 200, text: Feeds.HN_RSS })

      const result = await Refresh.fetchFeed(host, SOURCE)

      expect(result).toEqual({ kind: 'items', items: itemsOf(Feeds.HN_RSS, FALLBACK) })
      expect(fetched).toEqual([PRIMARY, FALLBACK])
    })
  }

  test('fails with both reasons when the fallback fails too', async () => {
    const { host, web } = Fixtures.fakeHostOf()

    web.set(PRIMARY, { status: 503, text: '' })
    web.set(FALLBACK, { status: 200, text: Pages.MESSY_PAGE_HTML })

    expect(await Refresh.fetchFeed(host, SOURCE)).toEqual({
      kind: 'failed',
      reason: 'HTTP 503; fallback: not a feed (not-a-feed)',
    })
  })

  test('a source without a fallback fails after one fetch', async () => {
    const { host, fetched } = Fixtures.fakeHostOf()
    const source = Fixtures.sourceAt('own')

    expect(await Refresh.fetchFeed(host, source)).toEqual({
      kind: 'failed',
      reason: `fetch failed: no page at ${source.url}`,
    })
    expect(fetched).toEqual([source.url])
  })
})
