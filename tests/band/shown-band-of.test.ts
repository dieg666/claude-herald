import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'
import Fixtures from '../fixtures'

describe('shown-band-of', () => {
  const withItems = async (bandSize?: unknown) => {
    const fake = Fixtures.fakeHostOf()

    await fake.host.state.sources.update(() => [Fixtures.sourceAt('src')])
    await fake.host.state.items.update(() => ({ src: Fixtures.datedItemsOf('src', 7) }))

    if (bandSize !== undefined) {
      await fake.host.state.settings.update(settings => ({
        ...settings,
        bandSize: bandSize as number,
      }))
    }

    return fake
  }

  test("the page holds the band's size in the settings, one while the band last drew compact", async () => {
    const { host } = await withItems(5)
    const rotation = Band.rotationOf()

    expect(await Band.shownBandOf(host, rotation)).toMatchObject({ size: 5 })

    rotation.isCompact = true

    expect((await Band.shownBandOf(host, rotation)).size).toBe(1)
    expect((await Band.shownBandOf(host, rotation)).items.length).toBe(7)
  })

  test('settings held without the size, or with one out of bounds, read as three or clamped', async () => {
    const rotation = Band.rotationOf()
    const without = await withItems()

    await without.host.state.settings.update(settings => {
      const { bandSize: _dropped, ...rest } = settings

      return rest as typeof settings
    })

    expect((await Band.shownBandOf(without.host, rotation)).size).toBe(3)
    expect((await Band.shownBandOf((await withItems(0)).host, rotation)).size).toBe(1)
    expect((await Band.shownBandOf((await withItems(50)).host, rotation)).size).toBe(9)
    expect((await Band.shownBandOf((await withItems('x')).host, rotation)).size).toBe(3)
  })
})
