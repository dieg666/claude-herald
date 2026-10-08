import { describe, expect, test } from 'claude-code/testing'

import Feed from '../../hooks/feed'
import type { ParsedFeed } from '../../hooks/feed'
import Refresh from '../../hooks/refresh'
import Feeds from '../fixtures/feeds'

describe('items-of-feed', () => {
  test('maps a real feed to items of the source, in feed order', () => {
    const parsed = Feed.parseFeed(Feeds.HNRSS_FRONTPAGE, 'https://hnrss.org/frontpage')

    if (!parsed.ok) {
      throw new Error(parsed.reason)
    }

    const items = Refresh.itemsOfFeed('hn', parsed.feed)

    expect(items.length).toBe(parsed.feed.entries.length)
    expect(items.map(item => item.title)).toEqual(parsed.feed.entries.map(entry => entry.title))

    for (const [index, item] of items.entries()) {
      const entry = parsed.feed.entries[index]

      expect(item.id).toBe(`hn:${entry?.guid ?? entry?.link}`)
      expect(item.sourceId).toBe('hn')
      expect(item.url).toBe(entry?.link)
      expect(item.text).toBe(entry?.summary ?? '')
      expect(item.publishedAt).toBe(entry?.publishedAt)
    }
  })

  test("takes the entry's language, else the feed's, and the feed's link when the entry has none", () => {
    const feed: ParsedFeed = {
      kind: 'rss',
      title: 'Feed',
      link: 'https://example.com/',
      lang: 'en',
      entries: [
        { guid: 'a', link: 'https://example.com/a', title: 'A', lang: 'es' },
        { guid: 'b', title: 'B' },
      ],
    }

    expect(Refresh.itemsOfFeed('src', feed)).toEqual([
      {
        id: 'src:a',
        sourceId: 'src',
        title: 'A',
        url: 'https://example.com/a',
        text: '',
        lang: 'es',
      },
      {
        id: 'src:b',
        sourceId: 'src',
        title: 'B',
        url: 'https://example.com/',
        text: '',
        lang: 'en',
      },
    ])
  })

  test('leaves out entries with no title, or no link anywhere', () => {
    const feed: ParsedFeed = {
      kind: 'atom',
      title: 'Feed',
      entries: [
        { guid: 'a', link: 'https://example.com/a', title: '  ' },
        { guid: 'b', title: 'No link' },
        { link: 'https://example.com/c', title: 'C', summary: 'About C' },
      ],
    }

    expect(Refresh.itemsOfFeed('src', feed)).toEqual([
      {
        id: 'src:https://example.com/c',
        sourceId: 'src',
        title: 'C',
        url: 'https://example.com/c',
        text: 'About C',
      },
    ])
  })

  test('the Comments link the Hacker News feed carries as its description is no text', () => {
    const parsed = Feed.parseFeed(Feeds.HN_RSS, 'https://news.ycombinator.com/rss')

    if (!parsed.ok) {
      throw new Error(parsed.reason)
    }

    expect(parsed.feed.entries.map(entry => entry.summary)).toEqual(Array(4).fill('Comments'))
    expect(Refresh.itemsOfFeed('hn', parsed.feed).map(item => item.text)).toEqual(Array(4).fill(''))
  })
})
