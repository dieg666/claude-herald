import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'
import Fixtures from '../fixtures'

describe('resize-band', () => {
  const flagged = (name: string, day: number) =>
    Fixtures.stackItemAt(name, '2.0.0', {
      current: '1.0.0',
      level: 'major',
      breaking: true,
      publishedAt: `2025-12-0${day}T00:00:00Z`,
    })

  test('writes the band in state inside pages of the new size, the selected item kept', async () => {
    const { host, state } = Fixtures.fakeHostOf()

    await host.state.sources.update(() => [Fixtures.sourceAt('src')])
    await host.state.items.update(() => ({ src: Fixtures.datedItemsOf('src', 7) }))
    await host.state.band.update(() => ({ offset: 6, selected: 0, isPaused: true }))

    await Band.resizeBand(host, 3, 5)

    expect(state.band).toEqual({ offset: 5, selected: 1, isPaused: true })
  })

  test('a package that leads only at the new size stays selected where it moves', async () => {
    const { host, state } = Fixtures.fakeHostOf()
    const stack = [flagged('one', 1), flagged('two', 2), flagged('three', 3)]

    await host.state.sources.update(() => [Fixtures.sourceAt('src')])
    await host.state.items.update(() => ({ src: Fixtures.datedItemsOf('src', 4) }))
    await host.state.stack.update(current => ({ ...current, root: '/work', items: stack }))

    // At three: three, two, src 1-4, one; the selection on one, the last item.
    await host.state.band.update(() => ({ offset: 6, selected: 0, isPaused: true }))

    await Band.resizeBand(host, 3, 5)

    // At five, one leads third: three, two, one, src 1-4.
    expect(state.band).toEqual({ offset: 0, selected: 2, isPaused: true })
  })

  test('a state that fails is logged, not thrown', async () => {
    const { host, logs } = Fixtures.fakeHostOf()

    host.state.items.read = async () => {
      throw new Error('state gone')
    }

    await Band.resizeBand(host, 3, 5)

    expect(logs).toEqual(['herald: band: could not resize: state gone'])
  })
})
