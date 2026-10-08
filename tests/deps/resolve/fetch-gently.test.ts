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

  /** The waits asked for backoff, the per-request deadlines left out. */
  const backoffsOf = (clock: { waitsAsked: () => number[] }) =>
    clock.waitsAsked().filter(ms => ms !== Resolve.RESOLVE_LIMITS.requestTimeoutMs)

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
    expect(backoffsOf(clock)).toEqual([1000, 2000, 4000])
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
      expect(backoffsOf(clock)).toEqual([])
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

  test('a request that never answers fails as timed out when the deadline passes, and is not retried', async () => {
    const { host, clock, times } = scripted([200])
    let outcome: unknown

    host.httpFetch = async () => {
      times.push(clock.now())

      return new Promise(() => {})
    }

    void Resolve.fetchGently(host, URL).then(value => {
      outcome = value
    })

    await clock.advance(Resolve.RESOLVE_LIMITS.requestTimeoutMs - 1)
    expect(outcome).toBeUndefined()

    await clock.advance(1)
    expect(outcome).toEqual({ kind: 'failed', reason: 'timed out' })

    await clock.advance(60_000)
    expect(times).toEqual([0])
    expect(backoffsOf(clock)).toEqual([])
  })

  test('an answer after the deadline changes nothing, and a late failure is not an unhandled rejection', async () => {
    for (const settle of ['resolve', 'reject'] as const) {
      const { host, clock } = scripted([200])
      let late: () => void = () => {}

      host.httpFetch = () =>
        new Promise((resolve, reject) => {
          late = () =>
            settle === 'resolve'
              ? resolve({ status: 200, ok: true, text: '{}' })
              : reject(new Error('socket closed'))
        })

      const outcome = Resolve.fetchGently(host, URL)

      await clock.advance(Resolve.RESOLVE_LIMITS.requestTimeoutMs)
      expect(await outcome).toEqual({ kind: 'failed', reason: 'timed out' })

      late()
      await clock.settle()
    }
  })

  test('a request that answers in time cancels its deadline', async () => {
    const { host, clock } = scripted([200])

    expect(await Resolve.fetchGently(host, URL)).toEqual({ kind: 'ok', text: '{}' })
    expect(clock.waitsAsked()).toEqual([Resolve.RESOLVE_LIMITS.requestTimeoutMs])

    await clock.advance(Resolve.RESOLVE_LIMITS.requestTimeoutMs)
    expect(clock.pendingWaits()).toBe(0)
  })
})
