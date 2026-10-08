import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'
import Fixtures from '../fixtures'
import Feeds from '../fixtures/feeds'

describe('save-new-source', () => {
  const URL = 'https://example.com/new.xml'
  const DRAFT = { url: URL, kind: 'feed' as const, name: 'New', title: 'New feed' }

  // Lets the first refresh, started without waiting, run to its end.
  const settle = async () => {
    for (let tick = 0; tick < 200; tick += 1) {
      await Promise.resolve()
    }
  }

  test("a first refresh that works records the source's refresh time in the store and state", async () => {
    const { host, web, stored, state } = Fixtures.fakeHostOf({ sources: [] })

    web.set(URL, { status: 200, text: Feeds.rssWithItems(2) })

    const saved = await Commands.saveNewSource(host, DRAFT)

    await settle()

    expect('source' in saved && saved.source.id).toBe('new')
    expect(stored.get('refreshedAt')).toEqual({ new: 1000 })
    expect((state.status as { refreshedAt: unknown }).refreshedAt).toEqual({ new: 1000 })
  })

  test('a first refresh that fails records no time', async () => {
    const { host, web, stored, state } = Fixtures.fakeHostOf({ sources: [] })

    web.set(URL, { status: 500, text: '' })

    await Commands.saveNewSource(host, DRAFT)
    await settle()

    expect(stored.get('refreshedAt')).toBeUndefined()
    expect((state.status as { refreshedAt: unknown }).refreshedAt).toEqual({})
  })
})
