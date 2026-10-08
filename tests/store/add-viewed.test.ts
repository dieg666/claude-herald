import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('add-viewed', () => {
  test('records the ids under viewed, by source', async () => {
    const { host, stored } = Fixtures.fakeHostOf()

    expect(await Store.addViewed(host, 'src', ['src:a', 'src:b'])).toEqual({
      src: ['src:a', 'src:b'],
    })
    expect(stored.get('viewed')).toEqual({ src: ['src:a', 'src:b'] })
    expect(stored.get('read')).toBeUndefined()
  })
})
