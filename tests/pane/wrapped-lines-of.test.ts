import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'

describe('wrapped-lines-of', () => {
  test('no labels take one line', () => {
    expect(Pane.wrappedLinesOf([], 10)).toBe(1)
  })

  test('a label that ends exactly at the edge, its gap counted, stays on the line; one cell more wraps', () => {
    // `abc` + 2 + `defg` is nine cells.
    expect(Pane.wrappedLinesOf(['abc', 'defg'], 9)).toBe(1)
    expect(Pane.wrappedLinesOf(['abc', 'defg'], 8)).toBe(2)
  })

  test('a label wider than the row takes a line of its own', () => {
    expect(Pane.wrappedLinesOf(['ab', 'x'.repeat(20), 'cd'], 10)).toBe(3)
    expect(Pane.wrappedLinesOf(['x'.repeat(20)], 10)).toBe(1)
  })

  test('wide characters count two cells', () => {
    // `漢字` is four cells: with `ab` and the gap, eight.
    expect(Pane.wrappedLinesOf(['ab', '漢字'], 8)).toBe(1)
    expect(Pane.wrappedLinesOf(['ab', '漢字'], 7)).toBe(2)
  })
})
