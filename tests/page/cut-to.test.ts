import { describe, expect, test } from 'claude-code/testing'

import Page from '../../hooks/page'

describe('cut-to', () => {
  test('text within the limit is returned whole', () => {
    expect(Page.cutTo('abc', 3)).toBe('abc')
    expect(Page.cutTo('abc', 10)).toBe('abc')
  })

  test('longer text keeps its first units', () => {
    expect(Page.cutTo('abcdef', 4)).toBe('abcd')
    expect(Page.cutTo('abcdef', 0)).toBe('')
  })

  test('a cut never leaves half of a surrogate pair', () => {
    expect(Page.cutTo('ab😀cd', 3)).toBe('ab')
    expect(Page.cutTo('ab😀cd', 4)).toBe('ab😀')
  })
})
