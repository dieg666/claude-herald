import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('add-saved', () => {
  test('saves an item at the head of the list with when it was saved', async () => {
    const { host, stored } = Fixtures.fakeHostOf({
      saved: [{ ...Fixtures.itemAt('old'), savedAt: 1 }],
    })

    const saved = await Store.addSaved(host, Fixtures.itemAt('new', '2026-01-01T00:00:00Z'), 2)

    expect(saved).toEqual([
      { ...Fixtures.itemAt('new', '2026-01-01T00:00:00Z'), savedAt: 2 },
      { ...Fixtures.itemAt('old'), savedAt: 1 },
    ])
    expect(stored.get('saved')).toEqual(saved)
  })

  test('an item already saved stays once, with its first save time', async () => {
    const { host, sets } = Fixtures.fakeHostOf({ saved: [{ ...Fixtures.itemAt('a'), savedAt: 1 }] })

    expect(await Store.addSaved(host, Fixtures.itemAt('a'), 5)).toEqual([
      { ...Fixtures.itemAt('a'), savedAt: 1 },
    ])
    expect(sets).toEqual([])
  })

  test("reads the store right before writing, keeping another session's save", async () => {
    const { host, stored } = Fixtures.fakeHostOf()

    await Store.addSaved(host, Fixtures.itemAt('a'), 1)
    stored.set('saved', [
      { ...Fixtures.itemAt('elsewhere'), savedAt: 2 },
      ...(stored.get('saved') as []),
    ])
    await Store.addSaved(host, Fixtures.itemAt('b'), 3)

    expect((await Store.loadSaved(host)).map(item => item.title)).toEqual(['b', 'elsewhere', 'a'])
  })

  test('a stack item is saved with its release', async () => {
    const [react] = Fixtures.STACK_SAMPLE
    const { host } = Fixtures.fakeHostOf()

    expect(await Store.addSaved(host, react!, 4)).toEqual([{ ...react!, savedAt: 4 }])
    expect(await Store.loadSaved(host)).toEqual([{ ...react!, savedAt: 4 }])
  })
})
