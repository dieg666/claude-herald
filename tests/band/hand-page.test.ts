import { describe, expect, test } from 'claude-code/testing'

import type { Item } from '../../types/index.js'
import Band from '../../hooks/band'
import Fixtures from '../fixtures'

describe('hand-page', () => {
  test('hands a page over while the band shows, and nothing while the Herald pane is shown', async () => {
    const fake = Fixtures.clockedHostOf()
    const pages: string[][] = []
    const rotation = Band.rotationOf(async (_host, items: readonly Item[]) => {
      pages.push(items.map(item => item.id))
    })
    const [first, second] = Fixtures.datedItemsOf('src', 2)

    fake.pane.isShown = true
    Band.handPage(fake.host, rotation, [first!])
    await fake.clock.settle()

    fake.pane.isShown = false
    Band.handPage(fake.host, rotation, [second!])
    await fake.clock.settle()

    expect(pages).toEqual([['src:2']])
  })
})
