import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'

describe('words-of', () => {
  test('splits on any run of whitespace, ignoring it at both ends', () => {
    expect(Commands.wordsOf('  add \t https://example.org/feed   My\nfeed  ')).toEqual([
      'add',
      'https://example.org/feed',
      'My',
      'feed',
    ])
  })

  test('keeps quoted text together without its quotes, either kind', () => {
    expect(Commands.wordsOf(`"a  b" 'c "d"' e`)).toEqual(['a  b', 'c "d"', 'e'])
  })

  test('joins quoted text to what touches it, and an unclosed quote runs to the end', () => {
    expect(Commands.wordsOf('x"y z"w "open quote')).toEqual(['xy zw', 'open quote'])
  })

  test('an empty pair of quotes is an empty word; nothing at all is no word', () => {
    expect(Commands.wordsOf('""')).toEqual([''])
    expect(Commands.wordsOf('   ')).toEqual([])
  })
})
