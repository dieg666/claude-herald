import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'

describe('summary-key-of', () => {
  test('is item id, language and kind joined by bars', () => {
    expect(Store.summaryKeyOf('hn:42', 'es', 'short')).toBe('hn:42|es|short')
  })
})
