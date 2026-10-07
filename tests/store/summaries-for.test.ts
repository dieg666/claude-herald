import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'

describe('summaries-for', () => {
  test('maps item ids to the short texts of one language', () => {
    expect(
      Store.summariesFor(
        [
          { itemId: 'a', lang: 'es', kind: 'short', text: 'uno' },
          { itemId: 'a', lang: 'en', kind: 'short', text: 'one' },
          { itemId: 'b', lang: 'es', kind: 'long', text: 'dos, largo' },
          { itemId: 'c', lang: 'es', kind: 'short', text: 'tres' },
        ],
        'es',
      ),
    ).toEqual({ a: 'uno', c: 'tres' })
  })
})
