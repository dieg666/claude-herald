import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'

describe('fit-columns', () => {
  test('a line that fits is kept whole', () => {
    expect(Band.fitColumns('hello', 5)).toBe('hello')
    expect(Band.fitColumns('', 0)).toBe('')
  })

  test('a longer line is cut with an ellipsis inside the width', () => {
    expect(Band.fitColumns('hello world', 8)).toBe('hello w…')
    expect(Band.fitColumns('hello world', 7)).toBe('hello…')
    expect(Band.fitColumns('hello', 1)).toBe('…')
    expect(Band.fitColumns('hello', 0)).toBe('')
    expect(Band.fitColumns('hello', -4)).toBe('')
  })

  test('wide characters take two cells and are never split', () => {
    expect(Band.displayWidthOf('漢字かな')).toBe(8)
    expect(Band.fitColumns('漢字かな', 8)).toBe('漢字かな')
    expect(Band.fitColumns('漢字かな', 7)).toBe('漢字か…')
    expect(Band.fitColumns('漢字かな', 6)).toBe('漢字…')
    expect(Band.fitColumns('a🎉b', 3)).toBe('a…')
  })

  test('combining marks take no cell', () => {
    expect(Band.displayWidthOf('été')).toBe(3)
    expect(Band.fitColumns('été', 3)).toBe('été')
  })

  test('the result never takes more cells than given', () => {
    const text = 'a漢b字c🎉dかe'

    for (let columns = 0; columns <= 12; columns += 1) {
      expect(Band.displayWidthOf(Band.fitColumns(text, columns)) <= columns).toBe(true)
    }
  })
})
