import { describe, expect, test } from 'claude-code/testing'

import Feed from '../../hooks/feed'
import Page from '../../hooks/page'
import Refresh from '../../hooks/refresh'
import Fixtures from '../fixtures'
import Feeds from '../fixtures/feeds'
import Pages from '../fixtures/pages'

describe('refresh-source', () => {
  const FEED = Fixtures.sourceAt('big')
  const PAGE = Fixtures.sourceAt('anthropic', { url: Pages.ANTHROPIC_NEWS_URL, kind: 'page' })
  const HASH = Page.pageHashOf(
    Page.extractionRequestOf(
      Pages.ANTHROPIC_NEWS_URL,
      Page.htmlToText(Pages.ANTHROPIC_NEWS_HTML, Pages.ANTHROPIC_NEWS_URL),
    ),
  )

  const feedHost = (count: number, entries: Record<string, unknown> = {}) => {
    const fake = Fixtures.fakeHostOf(entries)

    fake.web.set(FEED.url, { status: 200, text: Feeds.rssWithItems(count) })

    return fake
  }

  const ids = (...indexes: number[]) => indexes.map(index => `big:https://example.com/${index}`)

  test('a first load saves the items, mirrors them to state and marks them all seen, none new', async () => {
    const { host, stored, state } = feedHost(3)

    expect(await Refresh.refreshSource(host, FEED)).toEqual({ newItems: [] })

    const items = (stored.get('items') as Record<string, { id: string }[]>).big ?? []

    expect(items.map(item => item.id)).toEqual(ids(0, 1, 2))
    expect(state.items).toEqual({ big: items })
    expect(stored.get('seen')).toEqual({ big: ids(0, 1, 2) })
  })

  test('a later load returns only the unseen items and marks them seen', async () => {
    const { host, stored } = feedHost(5, { seen: { big: ids(0, 1) } })

    const outcome = await Refresh.refreshSource(host, FEED)

    expect(outcome.newItems.map(item => item.id)).toEqual(ids(2, 3, 4))
    expect(stored.get('seen')).toEqual({ big: [...ids(2, 3, 4), ...ids(0, 1)] })
    expect((await Refresh.refreshSource(host, FEED)).newItems).toEqual([])
  })

  test('a first load gives the source all its items as viewed, so none counts as new; later loads leave viewed alone', async () => {
    const { host, stored, state, web } = feedHost(3)

    await Refresh.refreshSource(host, FEED)

    expect(stored.get('viewed')).toEqual({ big: ids(0, 1, 2) })
    expect(state.viewed).toEqual({ big: ids(0, 1, 2) })

    web.set(FEED.url, { status: 200, text: Feeds.rssWithItems(5) })
    await Refresh.refreshSource(host, FEED)

    expect(stored.get('viewed')).toEqual({ big: ids(0, 1, 2) })
  })

  test('a source seen before viewed ids existed gets the items it already had as viewed, the new ones left out', async () => {
    const { host, stored, state } = feedHost(5, { seen: { big: ids(0, 1) } })

    await Refresh.refreshSource(host, FEED)

    expect(stored.get('viewed')).toEqual({ big: ids(0, 1) })
    expect(state.viewed).toEqual({ big: ids(0, 1) })
  })

  test('a viewed write that fails is logged and the run keeps its new items', async () => {
    const { host, logs } = feedHost(3, { seen: { big: ids(0) } })
    const storeSet = host.storeSet

    host.storeSet = async (key, value) => {
      if (key === 'viewed') {
        throw new Error('disk full')
      }

      return storeSet(key, value)
    }

    expect((await Refresh.refreshSource(host, FEED)).newItems.map(item => item.id)).toEqual(
      ids(1, 2),
    )
    expect(logs).toEqual(['herald: big: could not record the viewed items: disk full'])
  })

  test('items stay capped at 30', async () => {
    const kept = Array.from({ length: 30 }, (_, index) =>
      Fixtures.itemAt(`old${index}`, '2026-10-01T00:00:00.000Z'),
    )
    const { host, stored, state } = feedHost(40, { items: { big: kept }, seen: { big: [] } })

    const outcome = await Refresh.refreshSource(host, FEED)

    expect((stored.get('items') as Record<string, unknown[]>).big?.length).toBe(30)
    expect((state.items as Record<string, unknown[]>).big?.length).toBe(30)
    expect(outcome.newItems.length).toBe(30)
  })

  test('a failing feed keeps its items, reports the error and logs one debug line', async () => {
    const kept = [Fixtures.itemAt('a')]
    const { host, stored, sets, logs } = Fixtures.fakeHostOf({ items: { big: kept } })

    expect(await Refresh.refreshSource(host, FEED)).toEqual({
      newItems: [],
      error: `fetch failed: no page at ${FEED.url}`,
    })
    expect(stored.get('items')).toEqual({ big: kept })
    expect(sets).toEqual([])
    expect(logs).toEqual([`herald: big: fetch failed: no page at ${FEED.url}`])
  })

  test('a store that fails is reported, not thrown', async () => {
    const { host, logs } = feedHost(2)

    host.storeGet = async () => {
      throw new Error('store unavailable')
    }

    expect(await Refresh.refreshSource(host, FEED)).toEqual({
      newItems: [],
      error: 'store unavailable',
    })
    expect(logs).toEqual(['herald: big: store unavailable'])
  })

  test(
    'an unchanged page mirrors its kept items with no model call and no store write',
    { timeoutMs: 20_000 },
    async () => {
      const kept = [Fixtures.itemAt('a')]
      const { host, web, asked, sets, state } = Fixtures.fakeHostOf({
        items: { anthropic: kept },
        pageHashes: { anthropic: HASH },
        seen: { anthropic: ['src:a'] },
      })

      web.set(PAGE.url, { status: 200, text: Pages.ANTHROPIC_NEWS_HTML })

      expect(await Refresh.refreshSource(host, PAGE)).toEqual({ newItems: [] })
      expect(asked).toEqual([])
      expect(sets).toEqual([])
      expect(state.items).toEqual({ anthropic: kept })
    },
  )

  test(
    'an unchanged page keeps distinct entries that share one address',
    { timeoutMs: 20_000 },
    async () => {
      const kept = ['a', 'b', 'c'].map(key => ({
        ...Fixtures.itemAt(key, `2026-10-0${key === 'a' ? 3 : key === 'b' ? 2 : 1}T00:00:00Z`),
        url: 'https://example.com/changelog',
      }))

      const { host, web, state } = Fixtures.fakeHostOf({
        items: { anthropic: kept },
        pageHashes: { anthropic: HASH },
        seen: { anthropic: kept.map(item => item.id) },
      })

      web.set(PAGE.url, { status: 200, text: Pages.ANTHROPIC_NEWS_HTML })
      await Refresh.refreshSource(host, PAGE)

      expect(state.items).toEqual({ anthropic: kept })
    },
  )

  test(
    'a changed page stores its items and the new hash after the extraction',
    { timeoutMs: 20_000 },
    async () => {
      const { host, web, replies, stored } = Fixtures.fakeHostOf({
        pageHashes: { anthropic: 'old' },
      })

      web.set(PAGE.url, { status: 200, text: Pages.ANTHROPIC_NEWS_HTML })
      replies.push(Fixtures.answerOf('[{"title": "A", "url": "/news/a"}]'))

      await Refresh.refreshSource(host, PAGE)

      expect(stored.get('items')).toEqual({
        anthropic: [
          {
            id: 'anthropic:https://www.anthropic.com/news/a',
            sourceId: 'anthropic',
            title: 'A',
            url: 'https://www.anthropic.com/news/a',
            text: '',
          },
        ],
      })
      expect(stored.get('pageHashes')).toEqual({ anthropic: HASH })
    },
  )

  test(
    'a failed extraction keeps the old items and does not store the hash',
    { timeoutMs: 20_000 },
    async () => {
      const kept = [Fixtures.itemAt('a')]
      const { host, web, replies, stored, logs } = Fixtures.fakeHostOf({
        items: { anthropic: kept },
        pageHashes: { anthropic: 'old' },
      })

      web.set(PAGE.url, { status: 200, text: Pages.ANTHROPIC_NEWS_HTML })
      replies.push({
        isAnswered: false,
        reason: 'api-error',
        status: 529,
        error: 'overloaded',
        usage: {
          input_tokens: 0,
          output_tokens: 0,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
        },
      })

      expect(await Refresh.refreshSource(host, PAGE)).toEqual({
        newItems: [],
        error: 'model: api-error',
      })
      expect(stored.get('items')).toEqual({ anthropic: kept })
      expect(stored.get('pageHashes')).toEqual({ anthropic: 'old' })
      expect(logs).toEqual(['herald: anthropic: model: api-error'])
    },
  )

  test(
    'a page answered with no items keeps its items, stores the hash and is not asked again',
    { timeoutMs: 20_000 },
    async () => {
      const kept = [Fixtures.itemAt('a')]
      const { host, web, replies, asked, stored, state, logs } = Fixtures.fakeHostOf({
        items: { anthropic: kept },
        pageHashes: { anthropic: 'old' },
        seen: { anthropic: ['src:a'] },
      })

      web.set(PAGE.url, { status: 200, text: Pages.ANTHROPIC_NEWS_HTML })
      replies.push(Fixtures.answerOf('[]'))

      expect(await Refresh.refreshSource(host, PAGE)).toEqual({ newItems: [] })
      expect(stored.get('items')).toEqual({ anthropic: kept })
      expect(stored.get('pageHashes')).toEqual({ anthropic: HASH })
      expect(state.items).toEqual({ anthropic: kept })
      expect(logs).toEqual([])

      expect(await Refresh.refreshSource(host, PAGE)).toEqual({ newItems: [] })
      expect(asked.length).toBe(1)
    },
  )

  test(
    'a page with nothing on its first load stays a first load',
    { timeoutMs: 20_000 },
    async () => {
      const { host, web, replies, stored } = Fixtures.fakeHostOf()

      web.set(PAGE.url, { status: 200, text: Pages.ANTHROPIC_NEWS_HTML })
      replies.push(Fixtures.answerOf('[]'))

      await Refresh.refreshSource(host, PAGE)

      expect(stored.get('seen')).toBeUndefined()

      web.set(PAGE.url, { status: 200, text: '<a href="/news/a">A</a>' })
      replies.push(Fixtures.answerOf('[{"title": "A", "url": "/news/a"}]'))

      expect(await Refresh.refreshSource(host, PAGE)).toEqual({ newItems: [] })
      expect(stored.get('seen')).toEqual({
        anthropic: ['anthropic:https://www.anthropic.com/news/a'],
      })
    },
  )

  test('items whose save fails are already seen, so the next run does not report them again', async () => {
    const { host, web } = feedHost(2, { seen: { big: ids(0, 1) } })
    const storeSet = host.storeSet

    web.set(FEED.url, { status: 200, text: Feeds.rssWithItems(4) })
    host.storeSet = async (key, value) => {
      if (key === 'items') {
        throw new Error('disk full')
      }

      return storeSet(key, value)
    }

    expect(await Refresh.refreshSource(host, FEED)).toEqual({ newItems: [], error: 'disk full' })

    host.storeSet = storeSet

    expect(await Refresh.refreshSource(host, FEED)).toEqual({ newItems: [] })
  })

  test('a model call that rejects is reported, not thrown', { timeoutMs: 20_000 }, async () => {
    const { host, web } = Fixtures.fakeHostOf()

    web.set(PAGE.url, { status: 200, text: Pages.ANTHROPIC_NEWS_HTML })
    host.modelComplete = async () => {
      throw new Error('model blocked')
    }

    expect(await Refresh.refreshSource(host, PAGE)).toEqual({
      newItems: [],
      error: 'model blocked',
    })
  })

  test('a source removed or turned off while it is fetched gets nothing saved or mirrored', async () => {
    for (const after of [[], [{ ...FEED, isEnabled: false }]]) {
      const { host, stored, state } = Fixtures.fakeHostOf({ sources: [FEED] })
      let release: () => void = () => undefined

      host.httpFetch = () =>
        new Promise(resolve => {
          release = () => resolve({ status: 200, ok: true, text: Feeds.rssWithItems(2) })
        })

      const outcome = Refresh.refreshSource(host, FEED)

      for (let tick = 0; tick < 20; tick += 1) {
        await Promise.resolve()
      }

      stored.set('sources', after)
      release()

      expect(await outcome).toEqual({ newItems: [] })
      expect(stored.has('items')).toBe(false)
      expect(stored.has('seen')).toBe(false)
      expect(state.items).toEqual({})
    }
  })

  describe('a source that falls back to its second address', () => {
    const HN = Fixtures.sourceAt('hn', {
      url: 'https://hnrss.org/frontpage',
      fallbackUrl: 'https://news.ycombinator.com/rss',
    })

    const itemsOf = (xml: string, url: string) => {
      const parsed = Feed.parseFeed(xml, url)

      if (!parsed.ok) {
        throw new Error(parsed.reason)
      }

      return Refresh.itemsOfFeed('hn', parsed.feed)
    }

    const FROM_HNRSS = itemsOf(Feeds.HNRSS_SAME_STORIES, HN.url)
    const GUID_IDS = FROM_HNRSS.map(item => item.id)

    const fallingBack = (entries: Record<string, unknown>) => {
      const fake = Fixtures.fakeHostOf(entries)

      fake.web.set(HN.url, { status: 503, text: '' })
      fake.web.set(HN.fallbackUrl ?? '', { status: 200, text: Feeds.HN_RSS })

      return fake
    }

    test('the real fallback feed carries the same stories under other ids', () => {
      const fromHn = itemsOf(Feeds.HN_RSS, HN.fallbackUrl ?? '')

      expect(GUID_IDS[0]).toBe('hn:https://news.ycombinator.com/item?id=49996437')
      expect(fromHn[0]?.id).toBe('hn:https://www.anthropic.com/claude-haiku-5-5')
      expect(fromHn.map(item => item.url).slice(0, 3)).toEqual(FROM_HNRSS.map(item => item.url))
    })

    test('the same stories merge into the stored items, keeping their ids, text and seen state', async () => {
      const { host, stored, state } = fallingBack({
        items: { hn: FROM_HNRSS },
        seen: { hn: GUID_IDS },
      })

      const outcome = await Refresh.refreshSource(host, HN)
      const kept = (state.items as Record<string, typeof FROM_HNRSS>).hn ?? []

      expect(kept.length).toBe(4)
      expect(
        kept
          .map(item => item.id)
          .filter(id => GUID_IDS.includes(id))
          .sort(),
      ).toEqual([...GUID_IDS].sort())

      for (const item of FROM_HNRSS) {
        expect(kept.find(other => other.id === item.id)?.text).toBe(item.text)
      }

      expect(outcome.newItems.map(item => item.title)).toEqual([
        'Push ifs up and fors down: The idiom, its algebra, and its limits',
      ])
      expect(stored.get('items')).toEqual({ hn: kept })
    })

    test("with the first address back, stored fallback copies keep their ids and take the guid copy's text", async () => {
      const copies = itemsOf(Feeds.HN_RSS, HN.fallbackUrl ?? '')
      const { host, web, state } = Fixtures.fakeHostOf({
        items: { hn: copies },
        seen: { hn: copies.map(item => item.id) },
      })

      web.set(HN.url, { status: 200, text: Feeds.HNRSS_SAME_STORIES })

      const outcome = await Refresh.refreshSource(host, HN)
      const kept = (state.items as Record<string, typeof copies>).hn ?? []

      expect(kept.length).toBe(4)
      expect(kept.map(item => item.id).sort()).toEqual(copies.map(item => item.id).sort())
      expect(kept.filter(item => item.text.includes('Article URL:')).length).toBe(3)
      expect(outcome.newItems).toEqual([])
    })

    test('duplicates a user already has stored collapse onto the oldest id on the next refresh', async () => {
      const dupes = itemsOf(Feeds.HN_RSS, HN.fallbackUrl ?? '').map(item => ({
        ...item,
        text: 'Comments',
      }))

      const { host, stored } = fallingBack({
        items: { hn: [...dupes, ...FROM_HNRSS] },
        seen: { hn: [...GUID_IDS, ...dupes.map(item => item.id)] },
      })

      const outcome = await Refresh.refreshSource(host, HN)
      const kept = (stored.get('items') as Record<string, { id: string; url: string }[]>).hn ?? []

      expect(outcome.newItems).toEqual([])
      expect(kept.length).toBe(4)
      expect(new Set(kept.map(item => item.url)).size).toBe(4)
      expect(kept.filter(item => GUID_IDS.includes(item.id)).length).toBe(3)
    })
  })
})
