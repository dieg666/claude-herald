import { describe, expect, test } from 'claude-code/testing'

import Actions from '../../hooks/actions'
import Fixtures from '../fixtures'

describe('mark-read', () => {
  const KEPT = { ...Fixtures.itemAt('kept'), savedAt: 1 }
  const READ = { ...Fixtures.itemAt('read'), savedAt: 2 }

  test('removes the item from the saved list in the store and state, keeping the others', async () => {
    const { host, stored, state } = Fixtures.fakeHostOf({ saved: [READ, KEPT] })

    expect(await Actions.markRead(host, READ)).toBe(true)
    expect(stored.get('saved')).toEqual([KEPT])
    expect(state.saved).toEqual([KEPT])
  })

  test('records the saved item as read too, in the store and state', async () => {
    const { host, stored, state } = Fixtures.fakeHostOf({ saved: [READ, KEPT] })

    await host.state.saved.update(() => [READ, KEPT])

    expect(await Actions.markRead(host, READ)).toBe(true)
    expect(stored.get('read')).toEqual({ src: ['src:read'] })
    expect(state.read).toEqual({ src: ['src:read'] })
  })

  test('reads the store right before writing, so another session saving meanwhile is kept', async () => {
    const { host, stored, state } = Fixtures.fakeHostOf({ saved: [READ] })

    await host.state.saved.update(() => [READ])
    stored.set('saved', [KEPT, READ])

    expect(await Actions.markRead(host, READ)).toBe(true)
    expect(state.saved).toEqual([KEPT])
  })

  test('an item not saved changes nothing in the store', async () => {
    const { host, sets } = Fixtures.fakeHostOf({ saved: [KEPT] })

    expect(await Actions.markRead(host, READ)).toBe(true)
    expect(sets).toEqual([])
  })

  test('a store that fails is toasted, not thrown', async () => {
    const { host, toasts, logs } = Fixtures.fakeHostOf({ saved: [READ] })

    host.storeSet = async () => {
      throw new Error('read-only')
    }

    expect(await Actions.markRead(host, READ)).toBe(false)
    expect(toasts).toEqual(['Could not mark "read" as read: read-only'])
    expect(logs).toEqual(['herald: could not mark src:read as read: read-only'])
  })
})
