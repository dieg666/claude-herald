import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'

describe('summary-lang-of', () => {
  test('feed and fixed codes stand as they are', () => {
    expect(Store.summaryLangOf('feed', 'es')).toBe('feed')
    expect(Store.summaryLangOf('de', 'es')).toBe('de')
  })

  test("user is Claude Code's language, or feed while it is unset", () => {
    expect(Store.summaryLangOf('user', 'spanish')).toBe('spanish')
    expect(Store.summaryLangOf('user', undefined)).toBe('feed')
    expect(Store.summaryLangOf('user', ' ')).toBe('feed')
  })
})
