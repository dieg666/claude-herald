import { describe, expect, mock, test } from 'claude-code/testing'

import Fixtures from '../fixtures'
import Feeds from '../fixtures/feeds'

describe('set-enabled', () => {
  const FEED = Fixtures.sourceAt('feed', { name: 'My Feed' })

  const peeked = (text: string | undefined) =>
    JSON.parse(text ?? 'null') as { sources: { isEnabled: boolean }[] }

  test(
    'disable keeps the source, turned off, in the store and in state',
    { plugins: [Fixtures.STATE_PEEK] },
    async ($, on) => {
      const stored = Fixtures.storeOn(on, { sources: [FEED] })

      expect((await $.command.run(Fixtures.newsOf('disable my feed'))).text).toBe(
        'Disabled "My Feed"; it is kept but no longer fetched or shown.',
      )
      expect(stored.get('sources')).toEqual([{ ...FEED, isEnabled: false }])
      expect(peeked((await $.command.run(Fixtures.PEEK)).text).sources).toEqual([
        { ...FEED, isEnabled: false },
      ])
    },
  )

  test('enable turns it on and refreshes it at once', async ($, on) => {
    const clock = mock.clock(on)
    const stored = Fixtures.storeOn(on, { sources: [{ ...FEED, isEnabled: false }] })
    const fetched = Fixtures.webOn(on, new Map([[FEED.url, Feeds.rssWithItems(2)]]))

    expect((await $.command.run(Fixtures.newsOf('enable "My Feed"'))).text).toBe(
      'Enabled "My Feed"; it refreshes now.',
    )

    await clock.settle()

    expect(stored.get('sources')).toEqual([FEED])
    expect(fetched).toEqual([FEED.url])
    expect(Object.keys(stored.get('items') as object)).toEqual(['feed'])
  })

  test('a source already in that state is left alone', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [FEED] })

    expect((await $.command.run(Fixtures.newsOf('enable My Feed'))).text).toBe(
      '"My Feed" is already enabled.',
    )
    expect(stored.get('sources')).toEqual([FEED])
  })

  test('an unknown name is refused', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [FEED] })

    expect((await $.command.run(Fixtures.newsOf('disable Other'))).text).toBe(
      'No source is named "Other". /news list shows them.',
    )
    expect((await $.command.run(Fixtures.newsOf('enable Other'))).text).toBe(
      'No source is named "Other". /news list shows them.',
    )
    expect(stored.get('sources')).toEqual([FEED])
  })
})
