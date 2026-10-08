import { describe, expect, test } from 'claude-code/testing'

import Page from '../../hooks/page'
import Refresh from '../../hooks/refresh'
import Summaries from '../../hooks/summaries'
import Fixtures from '../fixtures'
import Pages from '../fixtures/pages'

describe('fetch-page', () => {
  const URL = Pages.ANTHROPIC_NEWS_URL
  const SOURCE = Fixtures.sourceAt('anthropic', { url: URL, kind: 'page' })
  const TEXT = Page.htmlToText(Pages.ANTHROPIC_NEWS_HTML, URL)
  const HASH = Page.pageHashOf(Page.extractionRequestOf(URL, TEXT))

  const REPLY = JSON.stringify([
    { title: 'Newest', url: '/news/newest', date: '2026-10-07' },
    { title: 'Older', url: 'https://www.anthropic.com/news/older', date: null },
  ])

  const ITEMS = [
    {
      id: 'anthropic:https://www.anthropic.com/news/newest',
      sourceId: 'anthropic',
      title: 'Newest',
      url: 'https://www.anthropic.com/news/newest',
      publishedAt: '2026-10-07T00:00:00.000Z',
      text: '',
    },
    {
      id: 'anthropic:https://www.anthropic.com/news/older',
      sourceId: 'anthropic',
      title: 'Older',
      url: 'https://www.anthropic.com/news/older',
      text: '',
    },
  ]

  const pageHost = (entries: Record<string, unknown> = {}) => {
    const fake = Fixtures.fakeHostOf(entries)

    fake.web.set(URL, { status: 200, text: Pages.ANTHROPIC_NEWS_HTML })

    return fake
  }

  test(
    'a changed page makes exactly one extraction call to haiku and yields its items and hash',
    { timeoutMs: 20_000 },
    async () => {
      const { host, replies, asked } = pageHost({ pageHashes: { anthropic: 'old' } })
      const signal = new AbortController().signal
      const request = Page.extractionRequestOf(URL, TEXT)

      replies.push(Fixtures.answerOf(REPLY))

      expect(await Refresh.fetchPage(host, SOURCE, signal)).toEqual({
        kind: 'items',
        items: ITEMS,
        pageHash: HASH,
      })
      expect(asked).toEqual([
        {
          request: {
            model: 'haiku',
            system: request.system,
            prompt: request.prompt,
            maxTokens: Refresh.REFRESH_LIMITS.extractionMaxTokens,
            timeoutMs: Refresh.REFRESH_LIMITS.extractionTimeoutMs,
          },
          signal,
        },
      ])
    },
  )

  test('an unchanged page makes no model call', { timeoutMs: 20_000 }, async () => {
    const { host, asked } = pageHost({ pageHashes: { anthropic: HASH } })

    expect(await Refresh.fetchPage(host, SOURCE)).toEqual({ kind: 'unchanged' })
    expect(asked).toEqual([])
  })

  test('a reply that is not answered fails with its reason', { timeoutMs: 20_000 }, async () => {
    const { host, replies } = pageHost()

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

    expect(await Refresh.fetchPage(host, SOURCE)).toEqual({
      kind: 'failed',
      reason: 'model: api-error',
    })
  })

  test('a malformed reply keeps only its valid items', { timeoutMs: 20_000 }, async () => {
    const { host, replies } = pageHost()

    replies.push(
      Fixtures.answerOf(
        '[{"title": "Older", "url": "https://www.anthropic.com/news/older"}, {"title": ""}, {"url": "javascript:alert(1)", "title": "x"}, 5, "text"]',
      ),
    )

    expect(await Refresh.fetchPage(host, SOURCE)).toEqual({
      kind: 'items',
      items: [ITEMS[1]],
      pageHash: HASH,
    })
  })

  test(
    'an answered reply with no usable item yields none, with its hash',
    { timeoutMs: 20_000 },
    async () => {
      const { host, replies } = pageHost()

      replies.push(Fixtures.answerOf('Sorry, I cannot help with that. {"items": ['))

      expect(await Refresh.fetchPage(host, SOURCE)).toEqual({
        kind: 'items',
        items: [],
        pageHash: HASH,
      })
    },
  )

  test('aborted and empty replies fail with no hash', { timeoutMs: 20_000 }, async () => {
    const { host, replies } = pageHost()
    const usage = {
      input_tokens: 0,
      output_tokens: 0,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
    }

    replies.push({ isAnswered: false, reason: 'aborted', usage })
    replies.push({ isAnswered: false, reason: 'empty-reply', usage })

    expect(await Refresh.fetchPage(host, SOURCE)).toEqual({
      kind: 'failed',
      reason: 'model: aborted',
    })
    expect(await Refresh.fetchPage(host, SOURCE)).toEqual({
      kind: 'failed',
      reason: 'model: empty-reply',
    })
  })

  test('a failed fetch or a non-2xx status makes no model call', async () => {
    const { host, web, asked } = Fixtures.fakeHostOf()

    expect(await Refresh.fetchPage(host, SOURCE)).toEqual({
      kind: 'failed',
      reason: `fetch failed: no page at ${URL}`,
    })

    web.set(URL, { status: 404, text: Pages.ANTHROPIC_NEWS_HTML })

    expect(await Refresh.fetchPage(host, SOURCE)).toEqual({ kind: 'failed', reason: 'HTTP 404' })
    expect(asked).toEqual([])
  })

  test('markup past the cap is not read', { timeoutMs: 20_000 }, async () => {
    const { host, web, asked } = Fixtures.fakeHostOf()
    const padding = `<!--${'x'.repeat(Refresh.REFRESH_LIMITS.pageHtmlChars)}-->`

    web.set(URL, { status: 200, text: `${padding}<a href="/news/late">Late</a>` })

    expect(await Refresh.fetchPage(host, SOURCE)).toEqual({ kind: 'failed', reason: 'empty page' })
    expect(asked).toEqual([])

    web.set(URL, { status: 200, text: `<!---->${'<a href="/news/late">Late</a>'}` })

    await Refresh.fetchPage(host, SOURCE)

    expect(asked.length).toBe(1)
  })

  test(
    "a teaser the page shows becomes the item's text, which a summary is written from; one the page does not show is dropped",
    { timeoutMs: 20_000 },
    async () => {
      const teaser =
        'Cyber Verification Program, which makes advanced cyber capabilities and reduced blocking classifiers available to qualifying security professionals.'
      const { host, replies } = pageHost()

      expect(TEXT).toContain(teaser)

      replies.push(
        Fixtures.answerOf(
          JSON.stringify([
            {
              title: 'Expanding the Cyber Verification Program',
              url: '/news/cyber-verification-program',
              date: '2026-10-06',
              teaser: teaser.toUpperCase(),
            },
            { title: 'Older', url: 'https://www.anthropic.com/news/older', teaser: null },
            {
              title: 'Invented',
              url: 'https://www.anthropic.com/news/invented',
              teaser: 'Anthropic expands access to a vetted cyber program for researchers.',
            },
          ]),
        ),
      )

      const fetched = await Refresh.fetchPage(host, SOURCE)
      const items = fetched.kind === 'items' ? fetched.items : []

      expect(items.map(item => item.text)).toEqual([teaser.toUpperCase(), '', ''])
      expect(items.map(item => Summaries.summaryTextOf(item) !== '')).toEqual([true, false, false])
    },
  )

  test(
    'a page last read with a hash of its text alone is read again',
    { timeoutMs: 20_000 },
    async () => {
      const { host, replies, asked } = pageHost({
        pageHashes: { anthropic: Page.contentHashOf(TEXT) },
      })

      replies.push(Fixtures.answerOf(REPLY))

      expect(await Refresh.fetchPage(host, SOURCE)).toEqual({
        kind: 'items',
        items: ITEMS,
        pageHash: HASH,
      })
      expect(asked.length).toBe(1)
    },
  )
})
