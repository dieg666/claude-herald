import { describe, expect, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'

describe('factory-sources', () => {
  test('lists the ten factory sources with their exact URLs, in order', () => {
    expect(Defaults.FACTORY_SOURCES.map(source => [source.name, source.url])).toEqual([
      ['Anthropic news', 'https://www.anthropic.com/news'],
      ['Claude Code releases', 'https://github.com/anthropics/claude-code/releases.atom'],
      [
        'Claude Agent SDK (TS)',
        'https://github.com/anthropics/claude-agent-sdk-typescript/releases.atom',
      ],
      ['Anthropic Python SDK', 'https://github.com/anthropics/anthropic-sdk-python/releases.atom'],
      ['MCP spec', 'https://github.com/modelcontextprotocol/modelcontextprotocol/releases.atom'],
      ['Claude status', 'https://status.claude.com/history.rss'],
      ['Hacker News', 'https://hnrss.org/frontpage'],
      ['Simon Willison', 'https://simonwillison.net/atom/everything/'],
      ['AINews (smol.ai)', 'https://news.smol.ai/rss.xml'],
      ['GitHub changelog', 'https://github.blog/changelog/feed/'],
    ])
  })

  test('Claude status alone is disabled', () => {
    expect(
      Defaults.FACTORY_SOURCES.filter(source => !source.isEnabled).map(source => source.name),
    ).toEqual(['Claude status'])
  })

  test('Hacker News alone has a fallback, the news.ycombinator.com feed', () => {
    expect(
      Defaults.FACTORY_SOURCES.flatMap(source =>
        source.fallbackUrl === undefined ? [] : [[source.name, source.fallbackUrl]],
      ),
    ).toEqual([['Hacker News', 'https://news.ycombinator.com/rss']])
  })

  test('Anthropic news alone is a page source', () => {
    expect(
      Defaults.FACTORY_SOURCES.filter(source => source.kind === 'page').map(source => source.name),
    ).toEqual(['Anthropic news'])
  })

  test('ids are unique, every source is a factory one, icons are one character', () => {
    const ids = Defaults.FACTORY_SOURCES.map(source => source.id)

    expect(new Set(ids).size).toBe(ids.length)

    for (const source of Defaults.FACTORY_SOURCES) {
      expect(source.isFactory, source.name).toBe(true)
      expect([...source.icon].length, source.name).toBe(1)
    }
  })
})
