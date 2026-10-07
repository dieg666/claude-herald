import { describe, expect, test } from 'claude-code/testing'

import Resolve from '../../../hooks/deps/resolve'
import Fixtures from '../../fixtures'

describe('fetch-gently', () => {
  const URL = 'https://pypi.org/pypi/requests/json'

  /** Answers each request with the next status, the last one repeating. */
  const scripted = (statuses: readonly number[]) => {
    const clocked = Fixtures.clockedHostOf()
    const times: number[] = []

    clocked.host.httpFetch = async () => {
      times.push(clocked.clock.now())

      const status = statuses[Math.min(times.length - 1, statuses.length - 1)] ?? 200

      return { status, ok: status === 200, text: status === 200 ? '{}' : '' }
    }

    return { ...clocked, times }
  }

  test('a 429 waits the backoff, then retries and succeeds', async () => {
    const { host, clock, times } = scripted([429, 200])
    let outcome: unknown

    void Resolve.fetchGently(host, URL).then(value => {
      outcome = value
    })

    await clock.advance(Resolve.RESOLVE_LIMITS.backoffMs - 1)
    expect(times).toEqual([0])
    expect(outcome).toBeUndefined()

    await clock.advance(1)
    expect(times).toEqual([0, 1000])
    expect(outcome).toEqual({ kind: 'ok', text: '{}' })
  })

  test('5xx answers back off exponentially and give up after the retries', async () => {
    const { host, clock, times } = scripted([503])
    let outcome: unknown

    void Resolve.fetchGently(host, URL).then(value => {
      outcome = value
    })

    await clock.advance(60_000)

    expect(Resolve.RESOLVE_LIMITS.retries).toBe(3)
    expect(clock.waitsAsked()).toEqual([1000, 2000, 4000])
    expect(times).toEqual([0, 1000, 3000, 7000])
    expect(outcome).toEqual({ kind: 'failed', reason: 'HTTP 503' })
  })

  test('a 404 is a definite not-found, another 4xx a failure, neither retried', async () => {
    for (const [status, outcome] of [
      [404, { kind: 'missing', status: 404 }],
      [403, { kind: 'failed', reason: 'HTTP 403' }],
    ] as const) {
      const { host, clock, times } = scripted([status])

      expect(await Resolve.fetchGently(host, URL)).toEqual(outcome)
      expect(times).toEqual([0])
      expect(clock.waitsAsked()).toEqual([])
    }
  })

  test('a network error resolves a failure instead of rejecting', async () => {
    const { host } = Fixtures.fakeHostOf()

    expect(await Resolve.fetchGently(host, URL)).toEqual({
      kind: 'failed',
      reason: `fetch failed: no page at ${URL}`,
    })
  })

  test('aborting during a backoff wait ends it at once, with no further request', async () => {
    const { host, clock, times } = scripted([429, 200])
    const controller = new AbortController()
    let outcome: unknown

    void Resolve.fetchGently(host, URL, controller.signal).then(value => {
      outcome = value
    })

    await clock.settle()
    controller.abort()
    await clock.settle()

    expect(outcome).toEqual({ kind: 'failed', reason: 'cancelled' })

    await clock.advance(60_000)
    expect(times).toEqual([0])
  })
})
