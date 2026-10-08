import type { Source } from '../../types/index.js'

/**
 * The sources a first run starts with; the user may disable or remove any of them.
 */
export const FACTORY_SOURCES: readonly Source[] = [
  {
    id: 'anthropic-news',
    name: 'Anthropic news',
    url: 'https://www.anthropic.com/news',
    kind: 'page',
    isEnabled: true,
    isFactory: true,
  },
  {
    id: 'claude-code-releases',
    name: 'Claude Code releases',
    url: 'https://github.com/anthropics/claude-code/releases.atom',
    kind: 'feed',
    isEnabled: true,
    isFactory: true,
  },
  {
    id: 'claude-agent-sdk-ts',
    name: 'Claude Agent SDK (TS)',
    url: 'https://github.com/anthropics/claude-agent-sdk-typescript/releases.atom',
    kind: 'feed',
    isEnabled: true,
    isFactory: true,
  },
  {
    id: 'anthropic-sdk-python',
    name: 'Anthropic Python SDK',
    url: 'https://github.com/anthropics/anthropic-sdk-python/releases.atom',
    kind: 'feed',
    isEnabled: true,
    isFactory: true,
  },
  {
    id: 'mcp-spec',
    name: 'MCP spec',
    url: 'https://github.com/modelcontextprotocol/modelcontextprotocol/releases.atom',
    kind: 'feed',
    isEnabled: true,
    isFactory: true,
  },
  {
    id: 'claude-status',
    name: 'Claude status',
    url: 'https://status.claude.com/history.rss',
    kind: 'feed',
    isEnabled: false,
    isFactory: true,
  },
  {
    id: 'hacker-news',
    name: 'Hacker News',
    url: 'https://hnrss.org/frontpage',
    kind: 'feed',
    isEnabled: true,
    fallbackUrl: 'https://news.ycombinator.com/rss',
    isFactory: true,
  },
  {
    id: 'simon-willison',
    name: 'Simon Willison',
    url: 'https://simonwillison.net/atom/everything/',
    kind: 'feed',
    isEnabled: true,
    isFactory: true,
  },
  {
    id: 'ainews',
    name: 'AINews (smol.ai)',
    url: 'https://news.smol.ai/rss.xml',
    kind: 'feed',
    isEnabled: true,
    isFactory: true,
  },
  {
    id: 'github-changelog',
    name: 'GitHub changelog',
    url: 'https://github.blog/changelog/feed/',
    kind: 'feed',
    isEnabled: true,
    isFactory: true,
  },
]
