import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'

describe('user-language-of', () => {
  test('reads a non-blank language setting', () => {
    expect(Store.userLanguageOf({ language: ' japanese ' })).toBe('japanese')
  })

  test('undefined when unset, blank or not a string', () => {
    expect(Store.userLanguageOf({})).toBeUndefined()
    expect(Store.userLanguageOf({ language: '' })).toBeUndefined()
    expect(Store.userLanguageOf({ language: 3 })).toBeUndefined()
  })
})
