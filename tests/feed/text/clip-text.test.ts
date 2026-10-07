import { describe, expect, test } from 'claude-code/testing'

import Text from '../../../hooks/feed/text'

describe('clip-text', () => {
  test('short text is unchanged', () => {
    expect(Text.clipText('short', 10)).toBe('short')
  })

  test('long text is cut at a word boundary with an ellipsis', () => {
    expect(Text.clipText('one two three four', 11)).toBe('one two\u2026')
  })

  test('a single long word is cut mid-word', () => {
    expect(Text.clipText('abcdefghij', 5)).toBe('abcd\u2026')
  })

  test('a cut never splits a surrogate pair', () => {
    expect(Text.clipText('abc\u{1F600}def', 5)).toBe('abc\u2026')
  })
})
