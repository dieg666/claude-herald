import { describe, expect, mock, test } from 'claude-code/testing'

import Fixtures from '../fixtures'
import Feeds from '../fixtures/feeds'
import Pages from '../fixtures/pages'

describe('add-page', () => {
  const URL = 'https://example.org/news'

  test('saves an HTML page as a page source named after its title, then extracts it', async ($, on) => {
    const clock = mock.clock(on)
    const stored = Fixtures.storeOn(on, { sources: [] })
    const asked: string[] = []

    Fixtures.webOn(on, new Map([[URL, Pages.ANTHROPIC_NEWS_HTML]]))
    on('model.complete', ($, e) => {
      asked.push(e.model)

      return {
        value: Fixtures.answerOf(JSON.stringify([{ title: 'A post', url: `${URL}/a-post` }])),
      }
    })

    const { text } = await $.command.run(Fixtures.newsOf(`add-page ${URL}`))

    await clock.settle()

    expect(text).toBe(
      'Added the page "Newsroom \\ Anthropic". Haiku reads its headlines on each refresh where the page changed.',
    )
    expect(stored.get('sources')).toEqual([
      {
        id: 'newsroom-anthropic',
        name: 'Newsroom \\ Anthropic',
        url: URL,
        kind: 'page',
        isEnabled: true,
        icon: 'N',
        isFactory: false,
      },
    ])
    expect(asked).toEqual(['haiku'])
    expect(stored.get('items')).toEqual({
      'newsroom-anthropic': [expect.objectContaining({ title: 'A post', url: `${URL}/a-post` })],
    })
  })

  test('a given name wins over the title', async ($, on) => {
    mock.clock(on)

    const stored = Fixtures.storeOn(on, { sources: [] })

    Fixtures.webOn(on, new Map([[URL, Feeds.HTML_PAGE]]))
    on('model.complete', () => ({ value: Fixtures.answerOf('[]') }))

    await $.command.run(Fixtures.newsOf(`add-page ${URL} Team blog`))

    expect(stored.get('sources')).toEqual([
      expect.objectContaining({ id: 'team-blog', name: 'Team blog', kind: 'page' }),
    ])
  })

  test('a feed is refused with a pointer to add, and nothing is saved', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [] })

    Fixtures.webOn(on, new Map([[URL, Feeds.HN_RSS]]))

    expect((await $.command.run(Fixtures.newsOf(`add-page ${URL}`))).text).toBe(
      `${URL} is a feed, not a web page; use /news add ${URL}.`,
    )
    expect(stored.get('sources')).toEqual([])
  })

  test('plain text, an error status and a non-http address are refused', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [] })

    Fixtures.webOn(
      on,
      new Map<string, string | { status: number; text: string }>([
        [URL, 'just some words'],
        ['https://example.org/gone', { status: 410, text: '<html><body>gone</body></html>' }],
      ]),
    )

    expect((await $.command.run(Fixtures.newsOf(`add-page ${URL}`))).text).toBe(
      `${URL} is not an HTML page, so it was not added.`,
    )
    expect((await $.command.run(Fixtures.newsOf('add-page https://example.org/gone'))).text).toBe(
      'https://example.org/gone answered HTTP 410, so it was not added.',
    )
    expect((await $.command.run(Fixtures.newsOf('add-page mailto:me@example.org'))).text).toBe(
      '"mailto:me@example.org" is not an http(s) address. Usage: /news add-page <url> [name]',
    )
    expect(stored.get('sources')).toEqual([])
  })
})
