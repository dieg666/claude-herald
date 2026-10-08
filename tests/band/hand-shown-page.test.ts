import { describe, expect, test } from 'claude-code/testing'

import type { Item } from '../../types/index.js'
import Band from '../../hooks/band'
import Fixtures from '../fixtures'

describe('hand-shown-page', () => {
  test('hands over the page shown now at the size the band last drew with', async () => {
    const { host } = Fixtures.fakeHostOf()
    const pages: string[][] = []
    const rotation = Band.rotationOf(async (_host, items: readonly Item[]) => {
      pages.push(items.map(item => item.id))
    })

    await host.state.sources.update(() => [Fixtures.sourceAt('src')])
    await host.state.items.update(() => ({ src: Fixtures.datedItemsOf('src', 7) }))
    await host.state.band.update(() => ({ offset: 3, selected: 1, isPaused: true }))

    expect((await Band.handShownPage(host, rotation)).map(item => item.id)).toEqual([
      'src:4',
      'src:5',
      'src:6',
    ])

    rotation.pageSize = 1

    expect((await Band.handShownPage(host, rotation)).map(item => item.id)).toEqual(['src:4'])
    expect(pages).toEqual([['src:4', 'src:5', 'src:6'], ['src:4']])
  })
})
