import { describe, expect, test } from 'claude-code/testing'

import type { Item } from '../../types/index.js'
import Band from '../../hooks/band'
import Fixtures from '../fixtures'

describe('turn-band', () => {
  const SOURCE = Fixtures.sourceAt('src')

  const bandWith = async (count: number) => {
    const fake = Fixtures.fakeHostOf()
    const pages: string[][] = []
    const rotation = Band.rotationOf(async (host, items: readonly Item[]) => {
      pages.push(items.map(item => item.id))
    })

    await fake.host.state.sources.update(() => [SOURCE])
    await fake.host.state.items.update(() => ({ src: Fixtures.datedItemsOf('src', count) }))

    return { ...fake, rotation, pages }
  }

  test('a page turn writes the band and hands the new page over once', async () => {
    const { host, state, rotation, pages } = await bandWith(7)

    expect((await Band.turnBand(host, rotation, 'next'))?.map(item => item.id)).toEqual([
      'src:4',
      'src:5',
      'src:6',
    ])
    expect(state.band).toEqual({ offset: 3, selected: 0, isPaused: true })
    expect(pages).toEqual([['src:4', 'src:5', 'src:6']])
  })

  test('a selection move or a pause writes the band but hands no page over', async () => {
    const { host, state, rotation, pages } = await bandWith(7)

    expect(await Band.turnBand(host, rotation, 'down')).toBeUndefined()
    expect(await Band.turnBand(host, rotation, 'auto')).toBeUndefined()
    expect(state.band).toEqual({ offset: 0, selected: 1, isPaused: false })
    expect(pages).toEqual([])
  })

  test('a timer turn while paused, or over three items or fewer, writes nothing', async () => {
    const writesOf = (fake: Awaited<ReturnType<typeof bandWith>>) => {
      const writes: unknown[] = []
      const update = fake.host.state.band.update

      fake.host.state.band.update = change => {
        writes.push(change)

        return update(change)
      }

      return writes
    }

    const paused = await bandWith(7)

    await paused.host.state.band.update(() => ({ offset: 0, selected: 0, isPaused: true }))

    const pausedWrites = writesOf(paused)

    expect(await Band.turnBand(paused.host, paused.rotation, 'rotate')).toBeUndefined()
    expect(pausedWrites.length).toBe(0)

    const few = await bandWith(3)
    const fewWrites = writesOf(few)

    expect(await Band.turnBand(few.host, few.rotation, 'rotate')).toBeUndefined()
    expect(fewWrites.length).toBe(0)

    // A page turn over one page still pauses, but hands no page over.
    expect(await Band.turnBand(few.host, few.rotation, 'next')).toBeUndefined()
    expect(fewWrites.length).toBe(1)
    expect(few.state.band).toEqual({ offset: 0, selected: 0, isPaused: true })
    expect([paused.pages, few.pages]).toEqual([[], []])
  })

  test('a page handed over whose summaries fail is logged, not thrown', async () => {
    const { host, logs } = await bandWith(4)
    const rotation = Band.rotationOf(async () => {
      throw new Error('model down')
    })

    expect((await Band.turnBand(host, rotation, 'next'))?.length).toBe(1)

    await Promise.resolve()

    expect(logs).toEqual(['news: band: model down'])
  })

  test('a state that fails is logged, not thrown', async () => {
    const { host, rotation, logs } = await bandWith(7)

    host.state.band.read = async () => {
      throw new Error('state gone')
    }

    expect(await Band.turnBand(host, rotation, 'next')).toBeUndefined()
    expect(logs).toEqual(['news: band: could not next: state gone'])
  })
})
