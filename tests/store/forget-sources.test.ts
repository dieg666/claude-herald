import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('forget-sources', () => {
  test("drops the sources' items, seen ids and page hashes, keeping the others", async () => {
    const { host, stored } = Fixtures.fakeHostOf({
      items: { a: [Fixtures.itemAt('x')], b: [] },
      seen: { a: ['x'], b: ['y'] },
      pageHashes: { a: 'h', b: 'k' },
      saved: [{ ...Fixtures.itemAt('x'), savedAt: 1 }],
    })

    await Store.forgetSources(host, ['a'])

    expect(stored.get('items')).toEqual({ b: [] })
    expect(stored.get('seen')).toEqual({ b: ['y'] })
    expect(stored.get('pageHashes')).toEqual({ b: 'k' })
    expect(stored.get('saved')).toEqual([{ ...Fixtures.itemAt('x'), savedAt: 1 }])
  })

  test('writes nothing for a key that holds none of them', async () => {
    const { host, sets } = Fixtures.fakeHostOf({ items: { b: [] }, seen: { a: [] } })

    await Store.forgetSources(host, ['a'])

    expect(sets).toEqual(['seen'])
  })
})
