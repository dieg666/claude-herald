import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('remove-saved', () => {
  test('removes the item with that id and saves the rest', async () => {
    const { host, stored } = Fixtures.fakeHostOf({
      saved: [
        { ...Fixtures.itemAt('a'), savedAt: 2 },
        { ...Fixtures.itemAt('b'), savedAt: 1 },
      ],
    })

    expect(await Store.removeSaved(host, 'src:a')).toEqual([
      { ...Fixtures.itemAt('b'), savedAt: 1 },
    ])
    expect(stored.get('saved')).toEqual([{ ...Fixtures.itemAt('b'), savedAt: 1 }])
  })

  test('an id not saved changes nothing and writes nothing', async () => {
    const { host, sets } = Fixtures.fakeHostOf({ saved: [{ ...Fixtures.itemAt('a'), savedAt: 1 }] })

    expect(await Store.removeSaved(host, 'src:zzz')).toEqual([
      { ...Fixtures.itemAt('a'), savedAt: 1 },
    ])
    expect(sets).toEqual([])
  })
})
