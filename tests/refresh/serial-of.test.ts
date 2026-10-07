import { describe, expect, test } from 'claude-code/testing'

import Refresh from '../../hooks/refresh'

describe('serial-of', () => {
  test('runs tasks one at a time in the order queued, past a failing one', async () => {
    const serially = Refresh.serialOf()
    const steps: string[] = []

    const task = (name: string, ticks: number) => async () => {
      steps.push(`${name} start`)

      for (let tick = 0; tick < ticks; tick += 1) {
        await Promise.resolve()
      }

      steps.push(`${name} end`)

      return name
    }

    const results = await Promise.allSettled([
      serially(task('a', 10)),
      serially(async () => {
        throw new Error('b failed')
      }),
      serially(task('c', 0)),
    ])

    expect(steps).toEqual(['a start', 'a end', 'c start', 'c end'])
    expect(results.map(result => result.status)).toEqual(['fulfilled', 'rejected', 'fulfilled'])
  })
})
