import { describe, expect, test } from 'claude-code/testing'

import Actions from '../../hooks/actions'
import Fixtures from '../fixtures'

describe('read-item', () => {
  test('records a news item as read under its source, in the store and state', async () => {
    const { host, stored, state } = Fixtures.fakeHostOf({ read: { other: ['other:1'] } })

    expect(await Actions.readItem(host, Fixtures.itemAt('a'))).toBe(true)
    expect(await Actions.readItem(host, Fixtures.itemAt('b'))).toBe(true)
    expect(stored.get('read')).toEqual({ other: ['other:1'], src: ['src:b', 'src:a'] })
    expect(state.read).toEqual({ other: ['other:1'], src: ['src:b', 'src:a'] })
  })

  test('a stack release is never recorded', async () => {
    const { host, sets } = Fixtures.fakeHostOf()
    const [release] = Fixtures.STACK_SAMPLE

    expect(await Actions.readItem(host, release!)).toBe(false)
    expect(sets).toEqual([])
  })

  test('a store that fails is logged to debug, not thrown or toasted', async () => {
    const { host, logs, toasts } = Fixtures.fakeHostOf()

    host.storeSet = async () => {
      throw new Error('read-only')
    }

    expect(await Actions.readItem(host, Fixtures.itemAt('a'))).toBe(false)
    expect(logs).toEqual(['herald: could not record src:a as read: read-only'])
    expect(toasts).toEqual([])
  })
})
