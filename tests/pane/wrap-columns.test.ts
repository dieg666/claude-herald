import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'

describe('wrap-columns', () => {
  test('a line that fits stays one line; a longer one wraps at spaces', () => {
    expect(Pane.wrapColumns('one two', 10, 3)).toEqual(['one two'])
    expect(Pane.wrapColumns('one two three four', 9, 3)).toEqual(['one two', 'three', 'four'])
    expect(Pane.wrapColumns('  one   two  ', 10, 3)).toEqual(['one two'])
  })

  test('text left past the last line ends it with an ellipsis after a whole word', () => {
    expect(Pane.wrapColumns('aa bb cc dd ee ff', 5, 2)).toEqual(['aa bb', 'cc…'])
    expect(Pane.wrapColumns('aa bb cc dd', 6, 1)).toEqual(['aa bb…'])
  })

  test('a word wider than a line is cut into pieces; wide characters count two cells', () => {
    expect(Pane.wrapColumns('abcdefgh ij', 4, 3)).toEqual(['abcd', 'efgh', 'ij'])
    expect(Pane.wrapColumns('漢字漢字漢', 4, 2)).toEqual(['漢字', '漢…'])
    expect(Pane.wrapColumns('abcdefghijkl', 4, 2)).toEqual(['abcd', 'efg…'])
  })

  test('nothing fits in no columns or no lines; empty text has no line', () => {
    expect(Pane.wrapColumns('one', 0, 3)).toEqual([])
    expect(Pane.wrapColumns('one', 5, 0)).toEqual([])
    expect(Pane.wrapColumns('', 5, 3)).toEqual([])
  })
})
