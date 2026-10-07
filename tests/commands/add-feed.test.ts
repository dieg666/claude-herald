import { describe, expect, mock, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'
import Fixtures from '../fixtures'
import Feeds from '../fixtures/feeds'

describe('add-feed', () => {
  const URL = 'https://example.org/weblog.xml'
  const OWN = Fixtures.sourceAt('own')

  const peeked = (text: string | undefined) =>
    JSON.parse(text ?? 'null') as { sources: { id: string; name: string }[] | null }

  test(
    'saves a feed that parses, named after its title, mirrors it and refreshes it',
    { plugins: [Fixtures.STATE_PEEK] },
    async ($, on) => {
      const clock = mock.clock(on)
      const stored = Fixtures.storeOn(on, { sources: [OWN] })
      const fetched = Fixtures.webOn(on, new Map([[URL, Feeds.SIMON_WILLISON]]))

      const { text } = await $.command.run(Fixtures.newsOf(`add ${URL}`))

      await clock.settle()

      const added = {
        id: 'simon-willison-s-weblog',
        name: "Simon Willison's Weblog",
        url: URL,
        kind: 'feed',
        isEnabled: true,
        icon: 'S',
        isFactory: false,
      }

      expect(text).toBe(
        `Added "Simon Willison's Weblog" with 4 entries. /news remove "Simon Willison's Weblog" stops following it.`,
      )
      expect(stored.get('sources')).toEqual([OWN, added])
      expect(peeked((await $.command.run(Fixtures.PEEK)).text).sources).toEqual([OWN, added])
      expect(fetched).toEqual([URL, URL])
      expect((stored.get('items') as Record<string, unknown[]>)[added.id]?.length).toBe(4)
    },
  )

  test('an HTML page is refused, with the reason, and nothing is saved', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [OWN] })

    Fixtures.webOn(on, new Map([[URL, Feeds.HTML_PAGE]]))

    const { text } = await $.command.run(Fixtures.newsOf(`add ${URL}`))

    expect(text).toBe(
      `${URL} is not an RSS or Atom feed, so it was not added. For a web page, use /news add-page ${URL}.`,
    )
    expect(stored.get('sources')).toEqual([OWN])
    expect(stored.has('items')).toBe(false)
  })

  test('a feed with no entries, a cut-short feed and an empty answer are refused', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [OWN] })

    Fixtures.webOn(
      on,
      new Map([
        ['https://example.org/empty.xml', Feeds.EMPTY_FEED],
        ['https://example.org/cut.xml', Feeds.SIMON_WILLISON.slice(0, 2000)],
        ['https://example.org/blank.xml', '  '],
      ]),
    )

    expect((await $.command.run(Fixtures.newsOf('add https://example.org/empty.xml'))).text).toBe(
      'The feed at https://example.org/empty.xml has no entries, so it was not added.',
    )
    expect((await $.command.run(Fixtures.newsOf('add https://example.org/cut.xml'))).text).toBe(
      'The feed at https://example.org/cut.xml is cut short, so it was not added.',
    )
    expect((await $.command.run(Fixtures.newsOf('add https://example.org/blank.xml'))).text).toBe(
      'https://example.org/blank.xml answered with nothing, so it was not added.',
    )
    expect(stored.get('sources')).toEqual([OWN])
  })

  test('a failed fetch or an error status is refused', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [OWN] })

    Fixtures.webOn(on, new Map([[URL, { status: 404, text: 'missing' }]]))

    expect((await $.command.run(Fixtures.newsOf(`add ${URL}`))).text).toBe(
      `${URL} answered HTTP 404, so it was not added.`,
    )
    expect(
      (await $.command.run(Fixtures.newsOf('add https://example.org/offline.xml'))).text,
    ).toMatch(
      /^Could not fetch https:\/\/example\.org\/offline\.xml \(.+\), so it was not added\.$/,
    )
    expect(stored.get('sources')).toEqual([OWN])
  })

  test('an address already followed is refused before fetching, a trailing slash or fragment aside', async ($, on) => {
    const factory = Defaults.FACTORY_SOURCES[7]
    const stored = Fixtures.storeOn(on, { sources: [factory] })
    const fetched = Fixtures.webOn(on, new Map())

    for (const address of [
      'https://simonwillison.net/atom/everything',
      'http://simonwillison.net/atom/everything/#top',
      'https://SIMONWILLISON.net/atom/everything//',
    ]) {
      expect((await $.command.run(Fixtures.newsOf(`add ${address}`))).text).toMatch(
        /is already followed as "Simon Willison"\.$/,
      )
    }

    expect(fetched).toEqual([])
    expect(stored.get('sources')).toEqual([factory])
  })

  test('the fallback address of a source counts as followed', async ($, on) => {
    Fixtures.storeOn(on, { sources: [Defaults.FACTORY_SOURCES[6]] })
    Fixtures.webOn(on, new Map())

    expect(
      (await $.command.run(Fixtures.newsOf('add https://news.ycombinator.com/rss'))).text,
    ).toBe('https://news.ycombinator.com/rss is already followed as "Hacker News".')
  })

  test('two feeds with the same title get distinct names and ids', async ($, on) => {
    const clock = mock.clock(on)
    const stored = Fixtures.storeOn(on, { sources: [Defaults.FACTORY_SOURCES[6]] })

    Fixtures.webOn(
      on,
      new Map([
        ['https://example.org/a.xml', Feeds.HN_RSS],
        ['https://example.org/b.xml', Feeds.HN_RSS],
      ]),
    )

    await $.command.run(Fixtures.newsOf('add https://example.org/a.xml'))
    await $.command.run(Fixtures.newsOf('add https://example.org/b.xml'))
    await clock.settle()

    const sources = stored.get('sources') as { id: string; name: string }[]

    expect(sources.map(source => [source.id, source.name])).toEqual([
      ['hacker-news', 'Hacker News'],
      ['hacker-news-2', 'Hacker News (2)'],
      ['hacker-news-3', 'Hacker News (3)'],
    ])
  })

  test('a name in quotes, spacing collapsed, and a quoted address with a space', async ($, on) => {
    const clock = mock.clock(on)
    const stored = Fixtures.storeOn(on, { sources: [] })

    Fixtures.webOn(on, new Map([['https://example.org/my%20feed.xml', Feeds.HN_RSS]]))

    const { text } = await $.command.run(
      Fixtures.newsOf('  add   "https://example.org/my feed.xml"   "My   own"  feed  '),
    )

    await clock.settle()

    expect(text).toMatch(/^Added "My own feed" with 4 entries\./)
    expect(stored.get('sources')).toEqual([
      expect.objectContaining({
        id: 'my-own-feed',
        name: 'My own feed',
        url: 'https://example.org/my%20feed.xml',
      }),
    ])
  })

  test('a name already taken is refused, ignoring case', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [OWN] })
    const fetched = Fixtures.webOn(on, new Map([[URL, Feeds.HN_RSS]]))

    expect((await $.command.run(Fixtures.newsOf(`add ${URL} OWN`))).text).toBe(
      'A source is already named "OWN"; pick another name, or /news remove OWN first.',
    )
    expect(fetched).toEqual([])
    expect(stored.get('sources')).toEqual([OWN])
  })

  test('an address that is not http(s) is refused', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [OWN] })

    for (const address of ['example.org/feed', 'ftp://example.org/feed', 'file:///etc/passwd']) {
      expect((await $.command.run(Fixtures.newsOf(`add ${address}`))).text).toBe(
        `"${address}" is not an http(s) address. Usage: /news add <url> [name]`,
      )
    }

    expect(stored.get('sources')).toEqual([OWN])
  })

  test('reads the sources right before saving, keeping one another session added meanwhile', async ($, on) => {
    mock.clock(on)

    const other = Fixtures.sourceAt('other')
    const stored = Fixtures.storeOn(on, { sources: [OWN] })
    let isFirst = true

    on('http.fetch', () => {
      if (isFirst) {
        isFirst = false
        stored.set('sources', [OWN, other])
      }

      return { value: { status: 200, ok: true, headers: {}, text: Feeds.HN_RSS } }
    })

    await $.command.run(Fixtures.newsOf(`add ${URL}`))

    expect((stored.get('sources') as { id: string }[]).map(source => source.id)).toEqual([
      'own',
      'other',
      'hacker-news',
    ])
  })

  test('the remove hint in the answer removes the source it names', async ($, on) => {
    mock.clock(on)

    const stored = Fixtures.storeOn(on, { sources: [OWN] })

    Fixtures.webOn(on, new Map([[URL, Feeds.SIMON_WILLISON]]))

    const { text } = await $.command.run(Fixtures.newsOf(`add ${URL}`))
    const hint = /\/news (remove .*) stops following it\.$/.exec(text ?? '')?.[1] ?? ''

    expect(hint).toBe(`remove "Simon Willison's Weblog"`)
    expect((await $.command.run(Fixtures.newsOf(hint))).text).toBe(
      `Removed "Simon Willison's Weblog".`,
    )
    expect(stored.get('sources')).toEqual([OWN])
  })

  test('quotes inside an address survive to the fetch', async ($, on) => {
    mock.clock(on)

    const stored = Fixtures.storeOn(on, { sources: [] })
    const fetched = Fixtures.webOn(on, new Map([['https://example.org/f?b=%22x%22', Feeds.HN_RSS]]))

    await $.command.run(Fixtures.newsOf('add https://example.org/f?b="x" Quoted'))

    expect(fetched[0]).toBe('https://example.org/f?b=%22x%22')
    expect(stored.get('sources')).toEqual([
      expect.objectContaining({ name: 'Quoted', url: 'https://example.org/f?b=%22x%22' }),
    ])
  })
})
