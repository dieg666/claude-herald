import type { Item } from '../../types/index.js'
import { datedItemsOf } from './dated-items-of.js'
import { sourceAt } from './source-at.js'
import { stackItemAt } from './stack-item-at.js'

/**
 * A release of a release source, titled `v<version>`, dated that many hours before 2026-01-02 (undated when not given).
 *
 * @param sourceId the source's id
 * @param version the release's version
 * @param hours hours before 2026-01-02, when dated
 */
function releaseOf(sourceId: string, version: string, hours?: number): Item {
  return {
    id: `${sourceId}:v${version}`,
    sourceId,
    title: `v${version}`,
    url: `https://example.com/${sourceId}/v${version}`,
    ...(hours === undefined
      ? {}
      : { publishedAt: new Date(Date.UTC(2026, 0, 2) - hours * 3_600_000).toISOString() }),
    text: `Notes of ${sourceId} ${version}, with enough detail to summarize`,
  }
}

/**
 * A band skewed by release feeds: 8 Hacker News items an hour apart from 2026-01-02 and 2 of `willison` (3 and 4 hours before); `code` holds 4 releases stored out of date order (the newest, v2.1.294, second, 2 hours before), `sdk` 3 (v0.3.294 and v0.3.293 tied 1 hour before, stored in that order), `mcp` (a tags feed) an undated one before 2 dated (v1.2.0 newest, 6 hours before), and `py` only undated ones; one stack release (5 hours before).
 */
export const RELEASE_BAND = {
  sources: [
    sourceAt('hn', { name: 'Hacker News' }),
    sourceAt('code', {
      name: 'Claude Code',
      url: 'https://github.com/anthropics/claude-code/releases.atom',
    }),
    sourceAt('sdk', {
      name: 'Agent SDK',
      url: 'https://github.com/anthropics/claude-agent-sdk-typescript/releases.atom',
    }),
    sourceAt('mcp', { name: 'MCP spec', url: 'https://github.com/owner/mcp/tags.atom' }),
    sourceAt('py', { name: 'Python SDK', url: 'https://github.com/owner/py/releases.atom' }),
    sourceAt('willison', { name: 'Willison' }),
  ],
  items: {
    hn: datedItemsOf('hn', 8),
    code: [
      releaseOf('code', '2.1.293', 3),
      releaseOf('code', '2.1.294', 2),
      releaseOf('code', '2.1.292', 7),
      releaseOf('code', '2.1.291', 9),
    ],
    sdk: [
      releaseOf('sdk', '0.3.294', 1),
      releaseOf('sdk', '0.3.293', 1),
      releaseOf('sdk', '0.3.292', 8),
    ],
    mcp: [releaseOf('mcp', '0.9.0'), releaseOf('mcp', '1.2.0', 6), releaseOf('mcp', '1.1.0', 10)],
    py: [releaseOf('py', '1.0.1'), releaseOf('py', '1.0.0')],
    willison: datedItemsOf('willison', 2, 3),
  },
  stack: [stackItemAt('vite', '5.1.0', { current: '5.0.0', publishedAt: '2026-01-01T19:00:00Z' })],
}
