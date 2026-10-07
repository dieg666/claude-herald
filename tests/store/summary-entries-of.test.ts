import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'

describe('summary-entries-of', () => {
  test('keeps whole entries in order and drops the rest', () => {
    const entry = { itemId: 'a', lang: 'feed', kind: 'long', text: 'x' }

    expect(
      Store.summaryEntriesOf([entry, { ...entry, kind: 'medium' }, { itemId: 'b' }, 3]),
    ).toEqual([entry])
    expect(Store.summaryEntriesOf({ a: 'x' })).toEqual([])
  })
})
