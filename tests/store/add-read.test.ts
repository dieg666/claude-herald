import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('add-read', () => {
  test('records the ids under read, by source', async () => {
    const { host, stored } = Fixtures.fakeHostOf()

    expect(await Store.addRead(host, 'src', ['src:a'])).toEqual({ src: ['src:a'] })
    expect(stored.get('read')).toEqual({ src: ['src:a'] })
    expect(stored.get('viewed')).toBeUndefined()
  })
})
