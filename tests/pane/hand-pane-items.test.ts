import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('hand-pane-items', () => {
  test('hands the items over without waiting; an empty list makes no call', async () => {
    const { host, logs } = Fixtures.fakeHostOf()
    const handed: string[][] = []
    const onShown = async (_: unknown, items: readonly { id: string }[]) => {
      handed.push(items.map(item => item.id))
    }

    Pane.handPaneItems(host, onShown, [])
    Pane.handPaneItems(host, onShown, [Fixtures.itemAt('a')])
    await Promise.resolve()

    expect(handed).toEqual([['src:a']])
    expect(logs).toEqual([])
  })

  test('a callback that rejects logs one debug line and never throws', async () => {
    const { host, logs } = Fixtures.fakeHostOf()

    expect(() =>
      Pane.handPaneItems(host, async () => Promise.reject(new Error('model down')), [
        Fixtures.itemAt('a'),
      ]),
    ).not.toThrow()

    for (let tick = 0; tick < 5; tick += 1) {
      await Promise.resolve()
    }

    expect(logs).toEqual(['news: pane: model down'])
  })
})
