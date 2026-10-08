import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'

describe('char-width-of', () => {
  test('letters, digits and the band glyphs take one cell', () => {
    for (const char of ['a', 'Z', '7', 'é', '›', '◀', '▶', '↑', '…', 'Ω', 'Я']) {
      expect([char, Band.charWidthOf(char)]).toEqual([char, 1])
    }
  })

  test('East Asian wide and full-width characters take two', () => {
    for (const char of ['漢', 'か', 'カ', '한', 'Ａ', '、', '￥', '\u{20000}']) {
      expect([char, Band.charWidthOf(char)]).toEqual([char, 2])
    }
  })

  test('emoji drawn as pictures take two', () => {
    for (const code of [
      0x1f389, 0x1f600, 0x1f680, 0x1f6ff, 0x1f7e2, 0x1f914, 0x1fa77, 0x1faff, 0x231a, 0x23f0,
      0x23f3, 0x23f8, 0x2614, 0x26a1, 0x2705, 0x274c, 0x2753, 0x2b50, 0x2b55,
    ]) {
      expect([code.toString(16), Band.charWidthOf(String.fromCodePoint(code))]).toEqual([
        code.toString(16),
        2,
      ])
    }
  })

  test('symbols in the same blocks that are not drawn as pictures take one', () => {
    for (const code of [0x2600, 0x2603, 0x2611, 0x2702, 0x2764, 0x27a1, 0x1f650, 0x1f700]) {
      expect([code.toString(16), Band.charWidthOf(String.fromCodePoint(code))]).toEqual([
        code.toString(16),
        1,
      ])
    }
  })

  test('combining marks and variation selectors take none', () => {
    for (const code of [0x0301, 0x0308, 0x20e3, 0xfe0f, 0xfe0e]) {
      expect(Band.charWidthOf(String.fromCodePoint(code))).toBe(0)
    }
  })
})
