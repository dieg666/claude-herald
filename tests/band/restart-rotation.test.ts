import { describe, expect, test } from 'claude-code/testing'

import type { Item } from '../../types/index.js'
import Band from '../../hooks/band'
import Fixtures from '../fixtures'

describe('restart-rotation', () => {
  const SOURCE = Fixtures.sourceAt('src')

  const rotationWith = async (entries: Record<string, unknown> = {}) => {
    const fake = Fixtures.fakeHostOf(entries)
    const pages: string[][] = []
    const rotation = Band.rotationOf(async (host, items: readonly Item[]) => {
      pages.push(items.map(item => item.id))
    })

    await fake.host.state.sources.update(() => [SOURCE])
    await fake.host.state.items.update(() => ({ src: Fixtures.datedItemsOf('src', 7) }))

    return { ...fake, rotation, pages }
  }

  test('starts a timer every rotateSeconds and hands the page shown over once', async () => {
    const { host, timers, rotation, pages, state } = await rotationWith({
      settings: { rotateSeconds: 45 },
    })

    await Band.restartRotation(host, rotation)

    expect(timers.map(timer => timer.ms)).toEqual([45_000])
    expect(pages).toEqual([['src:1', 'src:2', 'src:3']])

    timers[0]?.fn()

    // Lets the turn the timer started run to its end.
    for (let tick = 0; tick < 20; tick += 1) {
      await Promise.resolve()
    }

    expect(state.band).toEqual({ offset: 3, selected: 0, isPaused: false })
  })

  test('a restart cancels the timer before it; overlapping restarts leave one', async () => {
    const { host, timers, rotation } = await rotationWith()

    await Band.restartRotation(host, rotation)
    await Promise.all([Band.restartRotation(host, rotation), Band.restartRotation(host, rotation)])

    expect(timers.map(timer => timer.ms)).toEqual([20_000, 20_000, 20_000])
    expect(timers.filter(timer => !timer.isCancelled).length).toBe(1)
  })

  test('unreadable settings mean the default seconds; a timer that cannot start is logged', async () => {
    const { host, timers, rotation, logs, pages } = await rotationWith()

    host.storeGet = async () => {
      throw new Error('store gone')
    }

    await Band.restartRotation(host, rotation)

    expect(timers.map(timer => timer.ms)).toEqual([20_000])

    host.clockEvery = () => {
      throw new Error('no clock')
    }

    await Band.restartRotation(host, rotation)

    expect(rotation.timer).toBeUndefined()
    expect(logs).toEqual(['news: could not start the band rotation: no clock'])
    expect(pages.length).toBe(2)
  })

  test('nothing to show hands nothing over', async () => {
    const { host, rotation, pages } = await rotationWith()

    await host.state.items.update(() => ({}))
    await Band.restartRotation(host, rotation)

    expect(pages).toEqual([])
  })
})
