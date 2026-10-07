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

  test('a quote inside a word is literal, and an unclosed quote runs to the end', () => {
    expect(Commands.wordsOf('x"y z"w "open quote')).toEqual(['x"y', 'z"w', 'open quote'])
  })

  test('an apostrophe inside a word stays, so a name with one reads back unquoted', () => {
    expect(Commands.wordsOf("Simon Willison's Weblog")).toEqual(['Simon', "Willison's", 'Weblog'])
  })

  test('quotes inside an address stay', () => {
    expect(Commands.wordsOf(`https://example.org/f?b="x"&c='y' Name`)).toEqual([
      `https://example.org/f?b="x"&c='y'`,
      'Name',
    ])
  })

  test('a quote closes its span only before whitespace or the end', () => {
    expect(Commands.wordsOf(`"He said "it's"" next`)).toEqual([`He said "it's"`, 'next'])
  })

  test('an empty pair of quotes is an empty word; nothing at all is no word', () => {
    expect(Commands.wordsOf('""')).toEqual([''])
    expect(Commands.wordsOf('   ')).toEqual([])
  })
})
