import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'

describe('summary-key-of', () => {
  test('is item id, language and kind joined by bars', () => {
    expect(Store.summaryKeyOf('hn:42', 'es', 'short')).toBe('hn:42|es|short')
  })

  test('a bar inside a part cannot make two keys collide', () => {
    expect(Store.summaryKeyOf('a|es', 'short', 'short')).not.toBe(
      Store.summaryKeyOf('a', 'es|short', 'short'),
    )
    expect(Store.summaryKeyOf('a|b', 'es', 'long')).toBe('a%7Cb|es|long')
  })

  test('a literal escape inside a part stays distinct from an escaped bar', () => {
    expect(Store.summaryKeyOf('a%7Cb', 'es', 'long')).not.toBe(
      Store.summaryKeyOf('a|b', 'es', 'long'),
    )
  })
})
