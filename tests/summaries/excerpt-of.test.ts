import { describe, expect, test } from 'claude-code/testing'

import Feed from '../../hooks/feed'
import Refresh from '../../hooks/refresh'
import Summaries from '../../hooks/summaries'
import Feeds from '../fixtures/feeds'

/**
 * The items of a real hnrss sample, as the refresh loop stores them.
 *
 * @param xml the feed
 */
function hnItemsOf(xml: string) {
  const parsed = Feed.parseFeed(xml, 'https://hnrss.org/frontpage')

  if (!parsed.ok) {
    throw new Error(parsed.reason)
  }

  return Refresh.itemsOfFeed('hn', parsed.feed)
}

describe('excerpt-of', () => {
  test('every link post of the hnrss sample leaves no excerpt', () => {
    const items = hnItemsOf(Feeds.HNRSS_FRONTPAGE)

    expect(items.length).toBe(4)

    for (const item of items) {
      expect(item.text).toContain('Article URL:')
      expect(Summaries.excerptOf(item.text, item.title)).toBe('')
    }
  })

  test('an Ask HN post keeps its own text and loses the link and counter boilerplate', () => {
    const [item] = hnItemsOf(Feeds.HNRSS_ASK_HN)
    const excerpt = Summaries.excerptOf(item?.text ?? '', item?.title ?? '')

    expect(excerpt).toBe(
      'Our migrations lock the orders table for minutes during deploys. We are looking at online schema changes and expand-contract patterns, and would like to hear what has worked for teams running them on busy tables.',
    )
  })

  test('labelled URLs, counters and bare addresses go; the sentences around them stay', () => {
    const text =
      'Article URL: https://example.com/a Comments URL: https://news.example/item?id=1 Points: 1,204 # Comments: 289 The compiler now ships incremental builds. https://example.com/more Votes: 12'

    expect(Summaries.excerptOf(text, 'Compiler news')).toBe(
      'The compiler now ships incremental builds.',
    )
  })

  test('words that only resemble the labels are kept', () => {
    const text = 'The base URL: is configurable and the points system was rewritten in the app.'

    expect(Summaries.excerptOf(text, 'Other')).toBe(text)
  })

  test('little left after stripping, or only the title again, leaves no excerpt', () => {
    expect(Summaries.excerptOf('Points: 12 # Comments: 3', 'Some title')).toBe('')
    expect(Summaries.excerptOf('Show HN', 'Show HN: a thing')).toBe('')
    expect(Summaries.excerptOf('  https://example.com/x  ', 'Some title')).toBe('')
    expect(Summaries.excerptOf('', 'Some title')).toBe('')
    expect(Summaries.excerptOf('Some Title Here', 'Some title here, in full')).toBe('')
  })

  test('the excerpt is cut to the text limit', () => {
    const excerpt = Summaries.excerptOf('word '.repeat(2000), 'Other')

    expect(excerpt.length).toBeLessThanOrEqual(Summaries.SUMMARY_LIMITS.itemTextChars)
    expect(excerpt.length).toBeGreaterThan(Summaries.SUMMARY_LIMITS.itemTextChars - 10)
  })
})
