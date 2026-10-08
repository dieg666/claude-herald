import type { Host } from '../../host/host.js'
import { withinDeadline } from '../../refresh/within-deadline.js'
import type { FetchOutcome } from './fetch-outcome.js'
import { RESOLVE_LIMITS } from './resolve-limits.js'
import { RESOLVE_USER_AGENT } from './resolve-user-agent.js'
import { waitFor } from './wait-for.js'

/**
 * Fetches a URL with the resolver's User-Agent, retrying a 429 or 5xx answer after an exponentially growing wait; 404 and 410 are a definite not-found. A request that takes longer than `RESOLVE_LIMITS.requestTimeoutMs` is a failure, not retried; its late answer is dropped. Never rejects.
 *
 * @param host the engine
 * @param url what to fetch
 * @param signal stops retries and waits
 */
export async function fetchGently(
  host: Host,
  url: string,
  signal?: AbortSignal,
): Promise<FetchOutcome> {
  for (let attempt = 0; ; attempt += 1) {
    if (signal?.aborted === true) {
      return { kind: 'failed', reason: 'cancelled' }
    }

    let status: number

    try {
      const response = await withinDeadline(
        host,
        RESOLVE_LIMITS.requestTimeoutMs,
        host.httpFetch(url, { headers: { 'User-Agent': RESOLVE_USER_AGENT } }),
        () => undefined,
      )

      if (response === undefined) {
        return { kind: 'failed', reason: 'timed out' }
      }

      if (response.ok) {
        return { kind: 'ok', text: response.text }
      }

      status = response.status
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)

      return { kind: 'failed', reason: `fetch failed: ${message}` }
    }

    if (status === 404 || status === 410) {
      return { kind: 'missing', status }
    }

    if ((status !== 429 && status < 500) || attempt >= RESOLVE_LIMITS.retries) {
      return { kind: 'failed', reason: `HTTP ${status}` }
    }

    if (!(await waitFor(host, RESOLVE_LIMITS.backoffMs * 2 ** attempt, signal))) {
      return { kind: 'failed', reason: 'cancelled' }
    }
  }
}
