import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('save-items', () => {
  test("replaces one source's items and keeps the others", async () => {
    const other = { ...Fixtures.itemAt('o'), sourceId: 'other', id: 'other:o' }
    const { host } = Fixtures.fakeHostOf({
      items: { src: [Fixtures.itemAt('old')], other: [other] },
    })

    await Store.saveItems(host, 'src', [Fixtures.itemAt('new')])

    expect(await Store.loadItems(host)).toEqual({ src: [Fixtures.itemAt('new')], other: [other] })
  })

  test('loading drops stored entries that are not items', async () => {
    const { host } = Fixtures.fakeHostOf({
      items: { src: [Fixtures.itemAt('a'), { id: 'broken' }], bad: 'nope' },
    })

    expect(await Store.loadItems(host)).toEqual({ src: [Fixtures.itemAt('a')], bad: [] })
  })
})
