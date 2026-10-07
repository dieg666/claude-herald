import { describe, expect, test } from 'claude-code/testing'

import Refresh from '../../hooks/refresh'

describe('map-limited', () => {
  test('keeps input order whatever the finishing order', async () => {
    const delays = [30, 0, 20, 5, 10]

    const results = await Refresh.mapLimited(delays, 2, async delay => {
      for (let tick = 0; tick < delay; tick += 1) {
        await Promise.resolve()
      }

      return delay * 2
    })

    expect(results).toEqual([60, 0, 40, 10, 20])
  })

  test('never has more than the limit in flight, and uses all of it', async () => {
    let inFlight = 0
    let most = 0
    const pending: (() => void)[] = []

    const done = Refresh.mapLimited([1, 2, 3, 4, 5, 6, 7], 3, async value => {
      inFlight += 1
      most = Math.max(most, inFlight)
      await new Promise<void>(resolve => pending.push(resolve))
      inFlight -= 1

      return value
    })

    while (pending.length > 0 || inFlight > 0) {
      await Promise.resolve()
      pending.shift()?.()
      await Promise.resolve()
    }

    expect(await done).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(most).toBe(3)
  })

  test('maps nothing to nothing, and treats a limit below 1 as 1', async () => {
    expect(await Refresh.mapLimited([], 3, async value => value)).toEqual([])
    expect(await Refresh.mapLimited([1, 2], 0, async value => value + 1)).toEqual([2, 3])
  })
})
