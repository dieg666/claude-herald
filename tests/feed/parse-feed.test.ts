import { describe, expect, test } from 'claude-code/testing'

import Feed from '../../hooks/feed'
import Fixtures from '../fixtures/feeds'

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

const REFERENCE = /&(?:[A-Za-z][A-Za-z0-9]*|#\d+|#[xX][0-9A-Fa-f]+);/

const ANY_TAG = /<\/?[A-Za-z][^<>]*>/

const HTML_TAG =
  /<\/?(?:a|b|blockquote|br|code|div|em|h[1-6]|i|img|li|ol|p|pre|small|span|strong|ul|var)\b[^<>]*>/i

const feedOf = (xml: string, baseUrl?: string): Feed.ParsedFeed => {
  const result = Feed.parseFeed(xml, baseUrl)

  if (!result.ok) {
    throw new Error(`expected a feed, got ${result.reason}`)
  }

  return result.feed
}

const reasonOf = (xml: string): Feed.FeedFailure | undefined => {
  const result = Feed.parseFeed(xml)

  return result.ok ? undefined : result.reason
}

const elapsedOf = (run: () => void): number => {
  const start = performance.now()
  run()

  return performance.now() - start
}

const SAMPLES = [
  {
    name: 'Claude Code releases (Atom)',
    xml: Fixtures.CLAUDE_CODE_RELEASES,
    title: 'Release notes from claude-code',
    count: 4,
    first: {
      title: 'v2.1.293',
      link: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.293',
      publishedAt: '2026-10-07T18:10:20.000Z',
    },
  },
  {
    name: 'Claude Agent SDK (TS) releases (Atom)',
    xml: Fixtures.AGENT_SDK_TS_RELEASES,
    title: 'Release notes from claude-agent-sdk-typescript',
    count: 4,
    first: {
      title: 'v0.3.293',
      link: 'https://github.com/anthropics/claude-agent-sdk-typescript/releases/tag/v0.3.293',
      publishedAt: '2026-10-07T18:10:38.000Z',
    },
  },
  {
    name: 'Anthropic Python SDK releases (Atom)',
    xml: Fixtures.ANTHROPIC_SDK_PYTHON_RELEASES,
    title: 'Release notes from anthropic-sdk-python',
    count: 4,
    first: {
      title: 'v1.12.0',
      link: 'https://github.com/anthropics/anthropic-sdk-python/releases/tag/v1.12.0',
      publishedAt: '2026-10-07T17:57:07.000Z',
    },
  },
  {
    name: 'MCP spec releases (Atom)',
    xml: Fixtures.MCP_SPEC_RELEASES,
    title: 'Release notes from modelcontextprotocol',
    count: 4,
    first: {
      title: '2026-07-28',
      link: 'https://github.com/modelcontextprotocol/modelcontextprotocol/releases/tag/2026-07-28',
      publishedAt: '2026-07-28T16:47:49.000Z',
    },
  },
  {
    name: 'Claude status (RSS)',
    xml: Fixtures.CLAUDE_STATUS,
    title: 'Claude Status - Incident History',
    count: 4,
    first: {
      title: 'Issue with spend limits',
      link: 'https://status.claude.com/incidents/vmys9qn874h4',
      publishedAt: '2026-10-07T21:23:29.000Z',
    },
  },
  {
    name: 'hnrss front page (RSS)',
    xml: Fixtures.HNRSS_FRONTPAGE,
    title: 'Hacker News: Front Page',
    count: 4,
    first: {
      title: 'Despite what Watson said, Rosalind Franklin understood structure of DNA first',
      link: 'https://link.springer.com/article/10.1007/s10739-026-09866-7',
      publishedAt: '2026-10-07T19:56:16.000Z',
    },
  },
  {
    name: 'Hacker News RSS fallback (RSS)',
    xml: Fixtures.HN_RSS,
    title: 'Hacker News',
    count: 4,
    first: {
      title: 'Claude Haiku 5.5',
      link: 'https://www.anthropic.com/claude-haiku-5-5',
      publishedAt: '2026-10-07T18:01:32.000Z',
    },
  },
  {
    name: 'Simon Willison (Atom)',
    xml: Fixtures.SIMON_WILLISON,
    title: "Simon Willison's Weblog",
    count: 4,
    first: {
      title: 'Claude Haiku 5.5',
      link: 'https://simonwillison.net/2026/Oct/7/claude-haiku-5-5/',
      publishedAt: '2026-10-07T20:56:21.000Z',
    },
  },
  {
    name: 'AINews by smol.ai (RSS)',
    xml: Fixtures.SMOL_AI_NEWS,
    title: 'AINews',
    count: 3,
    first: {
      title: 'not much happened today',
      link: 'https://news.smol.ai/issues/26-09-09-not-much/',
      publishedAt: '2026-09-09T05:44:39.000Z',
    },
  },
  {
    name: 'GitHub changelog (RSS)',
    xml: Fixtures.GITHUB_CHANGELOG,
    title: 'Archive: 2026 - GitHub Changelog',
    count: 4,
    first: {
      title: 'Claude Haiku 5.5 in GitHub Copilot',
      link: 'https://github.blog/changelog/2026-10-07-claude-haiku-5-5-in-github-copilot',
      publishedAt: '2026-10-07T20:12:18.000Z',
    },
  },
] as const

describe('parse-feed', () => {
  for (const sample of SAMPLES) {
    test(`${sample.name}: title, entry count and first entry`, () => {
      const feed = feedOf(sample.xml)

      expect(feed.title).toBe(sample.title)
      expect(feed.entries).toHaveLength(sample.count)
      expect(feed.entries[0]).toMatchObject(sample.first)
    })

    test(`${sample.name}: every entry is clean plain text with an http(s) link and an ISO date`, () => {
      for (const entry of feedOf(sample.xml).entries) {
        expect(entry.title).not.toBe('')
        expect(entry.title).not.toMatch(REFERENCE)
        expect(entry.title).not.toMatch(ANY_TAG)
        expect(entry.title).not.toContain('<![CDATA[')
        expect(entry.link ?? '').toMatch(/^https?:\/\/\S+$/)
        expect(entry.publishedAt ?? '').toMatch(ISO)
        expect(entry.summary ?? '').not.toMatch(REFERENCE)
        expect(entry.summary ?? '').not.toMatch(HTML_TAG)
        expect(entry.summary ?? '').not.toContain('<![CDATA[')
        expect((entry.summary ?? '').length).toBeLessThanOrEqual(Feed.FEED_LIMITS.summaryChars)
      }
    })
  }

  test('a GitHub release body, escaped HTML, reads as a plain-text summary', () => {
    const [first] = feedOf(Fixtures.CLAUDE_CODE_RELEASES).entries

    expect(first?.guid).toBe('tag:github.com,2008:Repository/937253475/v2.1.293')
    expect(first?.summary).toStartWith(
      "What's changed Added Claude Haiku 5.5 (claude-haiku-5-5), now the default Haiku model on the Anthropic API \u2014 1M context",
    )
    expect(first?.summary).toEndWith('\u2026')
  })

  test('escaped code inside a release body stays as literal text', () => {
    const second = feedOf(Fixtures.CLAUDE_CODE_RELEASES).entries[1]

    expect(second?.summary).toContain('Added --marketplace <source> to claude plugin install')
  })

  test('feed-level link and language come from the document', () => {
    expect(feedOf(Fixtures.CLAUDE_CODE_RELEASES)).toMatchObject({
      kind: 'atom',
      link: 'https://github.com/anthropics/claude-code/releases',
      lang: 'en-US',
    })
    expect(feedOf(Fixtures.GITHUB_CHANGELOG)).toMatchObject({
      kind: 'rss',
      link: 'https://github.blog/changelog/',
      lang: 'en-US',
    })
    expect(feedOf(Fixtures.SMOL_AI_NEWS).lang).toBe('en-us')
    expect(feedOf(Fixtures.CLAUDE_STATUS).lang).toBeUndefined()
  })

  test('RSS description wins over content:encoded, numeric entities decoded', () => {
    const [first] = feedOf(Fixtures.GITHUB_CHANGELOG).entries

    expect(first?.summary).toBe(
      'Claude Haiku 5.5, Anthropic\u2019s newest lightweight model, is now generally available in GitHub Copilot. ' +
        'It is designed for fast, high-volume work like subagents, quick edits, and terminal tasks. In early\u2026 ' +
        'The post Claude Haiku 5.5 in GitHub Copilot appeared first on The GitHub Blog.',
    )
  })

  test('a status update body reads without its markup', () => {
    expect(feedOf(Fixtures.CLAUDE_STATUS).entries[0]?.summary).toStartWith(
      'Oct 7, 21:23 UTC Resolved - We have identified an issue',
    )
  })

  test('CDATA titles and bodies, named and numeric entities decode to clean text', () => {
    const feed = feedOf(Fixtures.RSS_CDATA_AND_ENTITIES)

    expect(feed).toMatchObject({
      title: "Ben & Jerry's <Changelog>",
      link: 'https://example.com/',
      lang: 'fr-FR',
    })
    expect(feed.entries).toEqual([
      {
        guid: 'item-a',
        link: 'https://example.com/a',
        title: 'CDATA & title',
        summary: 'First bold paragraph. Second one \u2013 done.',
        publishedAt: '2026-10-06T09:30:00.000Z',
      },
      {
        link: 'https://example.com/b',
        title: 'AT&T caf\u00E9 \u2019quoted\u2019 and spaced',
        summary: 'Escaped markup & an ampersand',
        publishedAt: '2026-10-05T06:00:00.000Z',
      },
      {
        link: 'https://example.com/c',
        title: 'Literal <div> in a title with bold',
        summary: 'Only content',
      },
    ])
  })

  test('double-encoded and unescaped HTML in descriptions read as plain text', () => {
    expect(
      feedOf(Fixtures.RSS_NESTED_MARKUP).entries.map(entry => [entry.title, entry.summary]),
    ).toEqual([
      ['Double encoded', 'Double & encoded one two'],
      ['Raw markup', 'Raw markup inside a second paragraph'],
      ['Tom & Jerry <3', undefined],
    ])
  })

  test('missing guid, link, title or date: the entry still parses with what it has', () => {
    expect(feedOf(Fixtures.RSS_MISSING_FIELDS).entries).toEqual([
      { link: 'https://example.com/link-only', title: 'Link only' },
      { guid: 'https://example.com/not-a-link', title: 'Guid not a permalink' },
      {
        guid: 'https://example.com/permalink',
        link: 'https://example.com/permalink',
        title: 'Permalink guid',
      },
      { title: 'Title only' },
      {
        title: 'No title, only a description that names the entry.',
        summary: 'No title, only a description that names the entry.',
      },
      { title: 'Bad date' },
      { title: 'Unsafe link' },
    ])
  })

  test('Atom link selection: alternate first, a link without rel is alternate, relative hrefs resolve', () => {
    const feed = feedOf(Fixtures.ATOM_LINKS)

    expect(feed).toMatchObject({ link: 'https://example.org/', lang: 'de' })
    expect(feed.entries.map(entry => entry.link)).toEqual([
      'https://example.org/entries/1',
      'https://example.org/entries/2',
      'https://example.org/blog/posts/3',
      'https://example.org/4.mp3',
      'https://example.org/entries/5',
    ])
  })

  test('Atom dates: published before updated, offsets folded into UTC', () => {
    expect(feedOf(Fixtures.ATOM_LINKS).entries.map(entry => entry.publishedAt)).toEqual([
      '2026-10-01T10:00:00.000Z',
      '2026-10-02T15:00:00.123Z',
      undefined,
      undefined,
      undefined,
    ])
  })

  test('an entry keeps its own xml:lang; the feed language is not copied onto it', () => {
    expect(feedOf(Fixtures.ATOM_LINKS).entries.map(entry => entry.lang)).toEqual([
      undefined,
      undefined,
      'en',
      undefined,
      undefined,
    ])
  })

  test('Atom text, html and xhtml titles and bodies each read as plain text', () => {
    const feed = feedOf(Fixtures.ATOM_TITLE_TYPES)

    expect(feed.title).toBe('Typed titles')
    expect(feed.entries.map(entry => [entry.title, entry.summary])).toEqual([
      ['Use <div> tags', 'Plain <div> text'],
      ['Emphasis & more', 'HTML content'],
      ['XHTML title', 'XHTML content two'],
      ['CDATA <text> title', 'CDATA html summary'],
    ])
  })

  test('an Atom feed with a namespace prefix on every element', () => {
    expect(feedOf(Fixtures.ATOM_PREFIXED)).toEqual({
      kind: 'atom',
      title: 'Prefixed',
      entries: [
        {
          guid: 'p1',
          link: 'https://example.com/1',
          title: 'One',
          publishedAt: '2026-10-07T00:00:00.000Z',
        },
      ],
    })
  })

  test('an RSS 1.0 feed, items beside the channel', () => {
    expect(feedOf(Fixtures.RDF_FEED)).toEqual({
      kind: 'rss',
      title: 'RDF news',
      link: 'https://example.net/',
      lang: 'en',
      entries: [
        {
          guid: 'https://example.net/1',
          link: 'https://example.net/1',
          title: 'First RDF item',
          publishedAt: '2026-10-07T12:00:00.000Z',
        },
      ],
    })
  })

  test('relative RSS links resolve against the URL the feed came from', () => {
    const xml =
      '<rss><channel><title>t</title><item><title>a</title><link>/posts/a</link></item></channel></rss>'

    expect(feedOf(xml, 'https://example.com/feed.xml').entries[0]?.link).toBe(
      'https://example.com/posts/a',
    )
    expect(feedOf(xml).entries[0]?.link).toBeUndefined()
  })

  test('blank input is empty', () => {
    expect(reasonOf('')).toBe('empty')
    expect(reasonOf(' \n\t ')).toBe('empty')
    expect(reasonOf('\uFEFF')).toBe('empty')
  })

  test('an HTML page or any other document is not a feed', () => {
    expect(reasonOf(Fixtures.HTML_PAGE)).toBe('not-a-feed')
    expect(reasonOf('<html><body><p>hello</p></body></html>')).toBe('not-a-feed')
    expect(reasonOf('<html>')).toBe('not-a-feed')
    expect(reasonOf('just some text')).toBe('not-a-feed')
    expect(reasonOf('{"items": []}')).toBe('not-a-feed')
    expect(reasonOf('<?xml version="1.0"?><note><to>x</to></note>')).toBe('not-a-feed')
    expect(reasonOf('<rss version="2.0"><title>no channel</title></rss>')).toBe('not-a-feed')
  })

  test('truncated XML is truncated', () => {
    const changelog = Fixtures.GITHUB_CHANGELOG

    expect(
      reasonOf(Fixtures.CLAUDE_CODE_RELEASES.slice(0, Fixtures.CLAUDE_CODE_RELEASES.length / 2)),
    ).toBe('truncated')
    expect(reasonOf(changelog.slice(0, changelog.indexOf('<![CDATA[') + 20))).toBe('truncated')
    expect(reasonOf(Fixtures.HN_RSS.slice(0, Fixtures.HN_RSS.lastIndexOf('</rss>')))).toBe(
      'truncated',
    )
    expect(reasonOf('<rss><channel><title>x</title><item><title a="unclosed')).toBe('truncated')
    expect(reasonOf('<rss><channel><!-- unclosed comment')).toBe('truncated')
  })

  test('no prefix of a feed parses as a feed, and none throws', () => {
    const xml = Fixtures.HN_RSS
    const failures = new Set<string>()

    for (let end = 0; end < xml.lastIndexOf('>'); end++) {
      const result = Feed.parseFeed(xml.slice(0, end))
      failures.add(result.ok ? 'ok' : result.reason)
    }

    expect([...failures].sort()).toEqual(['empty', 'not-a-feed', 'truncated'])
  })

  test('malformed fragments fail without throwing', () => {
    for (const xml of [
      '<',
      '<!',
      '<!--',
      '<![CDATA[',
      '</',
      '<a',
      '<a b',
      '<a b=',
      "<a b='",
      '<rss',
      '<rss/',
      '<<<>>>',
    ]) {
      expect(Feed.parseFeed(xml).ok).toBe(false)
    }
  })

  test('a 500-item feed parses quickly', () => {
    const xml = Fixtures.rssWithItems(500)
    let feed: Feed.ParsedFeed | undefined
    const elapsed = elapsedOf(() => {
      feed = feedOf(xml)
    })

    expect(elapsed).toBeLessThan(1000)
    expect(feed?.entries).toHaveLength(500)
    expect(feed?.entries[499]).toMatchObject({
      title: 'Item 499 & more',
      link: 'https://example.com/499',
      publishedAt: '2026-10-07T12:00:00.000Z',
    })
  })

  test('pathological input stays fast and never throws', () => {
    const open = '<rss><channel><title>x</title>'
    const inputs = [
      `${open}${'<a>'.repeat(100_000)}text${'</a>'.repeat(100_000)}</channel></rss>`,
      `${open}${'<a>'.repeat(100_000)}`,
      `${open}${'<a>'.repeat(50_000)}${'</b>'.repeat(50_000)}</channel></rss>`,
      `<rss>${'<a b="'.repeat(50_000)}`,
      `${open}<item><title>${'< '.repeat(200_000)}</title></item></channel></rss>`,
      `${open}<item><title>a</title><description>${'&lt;!--'.repeat(100_000)}</description></item></channel></rss>`,
      `${open}<item><title>a</title><description>${'word '.repeat(1_000_000)}</description></item></channel></rss>`,
    ]

    for (const xml of inputs) {
      expect(elapsedOf(() => Feed.parseFeed(xml))).toBeLessThan(2000)
    }

    expect(feedOf(inputs[0] ?? '').entries).toEqual([])
    expect(reasonOf(inputs[1] ?? '')).toBe('truncated')
    const summary = feedOf(inputs[6] ?? '').entries[0]?.summary ?? ''

    expect(summary.length).toBeLessThanOrEqual(Feed.FEED_LIMITS.summaryChars)
    expect(summary).toEndWith('word\u2026')
  })
})
