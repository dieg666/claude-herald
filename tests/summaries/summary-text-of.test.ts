import { describe, expect, test } from 'claude-code/testing'

import Feed from '../../hooks/feed'
import Refresh from '../../hooks/refresh'
import Summaries from '../../hooks/summaries'
import Fixtures from '../fixtures'
import Feeds from '../fixtures/feeds'

describe('summary-text-of', () => {
  test('an item with text of its own gives that text', () => {
    const item = Fixtures.itemAt('a')

    expect(Summaries.summaryTextOf(item)).toBe(item.text)
  })

  test('no text, blank text and text that repeats the title give nothing', () => {
    const item = { ...Fixtures.itemAt('a'), title: 'Introducing Claude Sonnet 5.5' }

    for (const text of ['', '   \n ', 'Introducing Claude Sonnet 5.5', 'claude sonnet 5.5']) {
      expect(Summaries.summaryTextOf({ ...item, text })).toBe('')
    }
  })

  test('an hnrss link post gives nothing once its boilerplate is gone', () => {
    const parsed = Feed.parseFeed(Feeds.HNRSS_FRONTPAGE, 'https://hnrss.org/frontpage')
    const items = parsed.ok ? Refresh.itemsOfFeed('hn', parsed.feed) : []

    expect(items.length > 0).toBe(true)
    expect(items.map(item => Summaries.summaryTextOf(item))).toEqual(items.map(() => ''))
  })

  test('the title is matched on one line, as the request sends it', () => {
    const item = { ...Fixtures.itemAt('a'), title: 'Two\nlines here', text: 'two lines here' }

    expect(Summaries.summaryTextOf(item)).toBe('')
  })
})
