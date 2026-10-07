import { describe, expect, test } from 'claude-code/testing'

import Summaries from '../../hooks/summaries'

describe('run-limited', () => {
  const settle = async () => {
    for (let tick = 0; tick < 20; tick += 1) {
      await Promise.resolve()
    }
  }

  test('never runs more than the limit at once, and runs every task', async () => {
    const limiter = Summaries.limiterOf(2)
    const pending: (() => void)[] = []
    let inFlight = 0
    let most = 0

    const runs = [1, 2, 3, 4, 5].map(value =>
      Summaries.runLimited(limiter, `k${value}`, async () => {
        inFlight += 1
        most = Math.max(most, inFlight)
        await new Promise<void>(resolve => pending.push(resolve))
        inFlight -= 1

        return value * 10
      }),
    )

    await settle()

    expect(inFlight).toBe(2)

    while (pending.length > 0) {
      pending.shift()?.()
      await settle()
    }

    expect(await Promise.all(runs)).toEqual([10, 20, 30, 40, 50])
    expect(most).toBe(2)
    expect(limiter.active).toBe(0)
    expect(limiter.inFlight.size).toBe(0)
  })

  test('a call with the key of a task in flight shares its result and does not run again', async () => {
    const limiter = Summaries.limiterOf(2)
    let runs = 0
    let release = () => {}

    const task = async () => {
      runs += 1
      await new Promise<void>(resolve => {
        release = resolve
      })

      return runs
    }

    const first = Summaries.runLimited(limiter, 'same', task)
    const second = Summaries.runLimited(limiter, 'same', task)

    expect(second).toBe(first)

    await settle()
    release()

    expect(await Promise.all([first, second])).toEqual([1, 1])
    expect(runs).toBe(1)
  })

  test('a task waiting for a slot is shared too', async () => {
    const limiter = Summaries.limiterOf(1)
    const pending: (() => void)[] = []
    let runs = 0

    const task = async () => {
      runs += 1
      await new Promise<void>(resolve => pending.push(resolve))
    }

    const busy = Summaries.runLimited(limiter, 'busy', task)
    const queued = Summaries.runLimited(limiter, 'queued', task)

    expect(Summaries.runLimited(limiter, 'queued', task)).toBe(queued)

    while (pending.length > 0 || runs < 2) {
      await settle()
      pending.shift()?.()
    }

    await Promise.all([busy, queued])

    expect(runs).toBe(2)
  })

  test('a key is free again once its task settles, and a failing task frees its slot', async () => {
    const limiter = Summaries.limiterOf(1)
    let runs = 0

    const failing = Summaries.runLimited(limiter, 'k', async () => {
      runs += 1

      throw new Error('down')
    })

    await expect(failing).rejects.toThrow('down')
    expect(limiter.active).toBe(0)
    expect(limiter.inFlight.size).toBe(0)

    expect(await Summaries.runLimited(limiter, 'k', async () => (runs += 1))).toBe(2)
  })

  test('a limit below one is one, and the default is two', () => {
    expect(Summaries.limiterOf(0).max).toBe(1)
    expect(Summaries.limiterOf().max).toBe(2)
    expect(Summaries.SUMMARY_LIMITS.concurrentRequests).toBe(2)
  })
})
