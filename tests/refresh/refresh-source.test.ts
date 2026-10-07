import { describe, expect, test } from 'claude-code/testing'

import Page from '../../hooks/page'
import Refresh from '../../hooks/refresh'
import Fixtures from '../fixtures'
import Feeds from '../fixtures/feeds'
import Pages from '../fixtures/pages'

describe('refresh-source', () => {
  const FEED = Fixtures.sourceAt('big')
  const PAGE = Fixtures.sourceAt('anthropic', { url: Pages.ANTHROPIC_NEWS_URL, kind: 'page' })
  const HASH = Page.contentHashOf(
    Page.htmlToText(Pages.ANTHROPIC_NEWS_HTML, Pages.ANTHROPIC_NEWS_URL),
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
    expect(logs).toEqual([`news: big: fetch failed: no page at ${FEED.url}`])
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
    expect(logs).toEqual(['news: big: store unavailable'])
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
      replies.push(Fixtures.answerOf('not json at all'))

      expect(await Refresh.refreshSource(host, PAGE)).toEqual({
        newItems: [],
        error: 'no items extracted',
      })
      expect(stored.get('items')).toEqual({ anthropic: kept })
      expect(stored.get('pageHashes')).toEqual({ anthropic: 'old' })
      expect(logs).toEqual(['news: anthropic: no items extracted'])
    },
  )

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
})
