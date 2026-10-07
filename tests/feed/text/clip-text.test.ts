import { describe, expect, test } from 'claude-code/testing'

import Text from '../../../hooks/feed/text'

describe('clip-text', () => {
  test('short text is unchanged', () => {
    expect(Text.clipText('short', 10)).toBe('short')
  })

  test('long text is cut at a word boundary with an ellipsis', () => {
    expect(Text.clipText('one two three four', 11)).toBe('one two\u2026')
  })

  test('a mid-sentence cut backs off to the last space', () => {
    expect(Text.clipText('The quick brown fox jumps over the lazy dog', 20)).toBe(
      'The quick brown\u2026',
    )
  })

  test('a space too early in the text does not shorten the cut', () => {
    expect(Text.clipText('abcdef ghijklmnop', 12)).toBe('abcdef ghij\u2026')
  })

  test('a single long word is cut mid-word', () => {
    expect(Text.clipText('abcdefghij', 5)).toBe('abcd\u2026')
  })

  test('a cut never splits a surrogate pair', () => {
    expect(Text.clipText('abc\u{1F600}def', 5)).toBe('abc\u2026')
  })
})
