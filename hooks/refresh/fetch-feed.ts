import type { Source } from '../../types/index.js'
import { parseFeed } from '../feed/parse-feed.js'
import type { Host } from '../host/host.js'
import type { Fetched } from './fetched.js'
import { itemsOfFeed } from './items-of-feed.js'
import { messageOf } from './message-of.js'

/**
 * Fetches and parses one feed address.
 *
 * @param host the engine
 * @param sourceId the source the feed belongs to
 * @param url the address
 */
async function fetchOne(host: Host, sourceId: string, url: string): Promise<Fetched> {
  let response: Awaited<ReturnType<Host['httpFetch']>>

  try {
    response = await host.httpFetch(url)
  } catch (error) {
    return { kind: 'failed', reason: `fetch failed: ${messageOf(error)}` }
  }

  if (!response.ok) {
    return { kind: 'failed', reason: `HTTP ${response.status}` }
  }

  const parsed = parseFeed(response.text, url)

  return parsed.ok
    ? { kind: 'items', items: itemsOfFeed(sourceId, parsed.feed) }
    : { kind: 'failed', reason: `not a feed (${parsed.reason})` }
}

/**
 * A feed source's items, read from its fallback address when the main one fails to fetch, answers non-2xx or does not parse; never throws.
 *
 * @param host the engine
 * @param source the feed source
 */
export async function fetchFeed(host: Host, source: Source): Promise<Fetched> {
  const primary = await fetchOne(host, source.id, source.url)

  if (primary.kind !== 'failed' || source.fallbackUrl === undefined) {
    return primary
  }

  const fallback = await fetchOne(host, source.id, source.fallbackUrl)

  return fallback.kind === 'failed'
    ? { kind: 'failed', reason: `${primary.reason}; fallback: ${fallback.reason}` }
    : fallback
}
