import { describe, expect, test } from 'claude-code/testing'

import Refresh from '../../hooks/refresh'
import Fixtures from '../fixtures'
import Feeds from '../fixtures/feeds'

describe('restart-refresh', () => {
  const ONE = Fixtures.sourceAt('one')

  const hostWith = (entries: Record<string, unknown> = {}) => {
    const fake = Fixtures.fakeHostOf({ sources: [ONE], ...entries })

    fake.web.set(ONE.url, { status: 200, text: Feeds.rssWithItems(1) })

    return fake
  }

  test('starts a timer every refreshMinutes and refreshes once at once', async () => {
    const { host, timers, fetched } = hostWith({ settings: { refreshMinutes: 7 } })
    const loop = Refresh.refreshLoopOf()

    expect((await Refresh.restartRefresh(host, loop)).isSkipped).toBe(false)
    expect(timers.map(timer => timer.ms)).toEqual([7 * 60_000])
    expect(fetched).toEqual([ONE.url])

    timers[0]?.fn()
    await Refresh.refreshAll(host, Refresh.refreshLoopOf())

    expect(fetched.length).toBe(3)
  })

  test('a restart cancels the timer before it, leaving one', async () => {
    const { host, timers } = hostWith()
    const loop = Refresh.refreshLoopOf()

    await Refresh.restartRefresh(host, loop)
    await Refresh.restartRefresh(host, loop)

    expect(timers.map(timer => timer.isCancelled)).toEqual([true, false])
  })

  test('overlapping restarts leave one live timer and one refresh', async () => {
    const { host, timers, fetched } = hostWith()
    const loop = Refresh.refreshLoopOf()

    const runs = await Promise.all([
      Refresh.restartRefresh(host, loop),
      Refresh.restartRefresh(host, loop),
      Refresh.restartRefresh(host, loop),
    ])

    expect(timers.filter(timer => !timer.isCancelled).length).toBe(1)
    expect(runs.filter(run => !run.isSkipped).length).toBe(1)
    expect(fetched).toEqual([ONE.url])
  })

  test('uses the default interval when the settings cannot be read', async () => {
    const { host, timers, logs } = hostWith()

    host.storeGet = async () => {
      throw new Error('store unavailable')
    }

    await Refresh.restartRefresh(host, Refresh.refreshLoopOf())

    expect(timers.map(timer => timer.ms)).toEqual([5 * 60_000])
    expect(logs).toEqual(['news: the refresh failed: store unavailable'])
  })

  test('a timer that cannot start is logged and the refresh still runs', async () => {
    const { host, fetched, logs } = hostWith()
    const loop = Refresh.refreshLoopOf()

    host.clockEvery = () => {
      throw new Error('refused')
    }

    await Refresh.restartRefresh(host, loop)

    expect(loop.timer).toBeUndefined()
    expect(fetched).toEqual([ONE.url])
    expect(logs).toEqual(['news: could not start the refresh timer: refused'])
  })
})
