import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'

describe('header-columns-of', () => {
  test('the name, the position with both numbers as long as the total, and the three Buttons at the wider auto label', () => {
    // Herald, a gap, `0–0 of 7`, a gap and a margin, then `p: ◀`, `n: ▶`, `a: ⏸ auto` (the pause glyph counts two cells) and two gaps.
    expect(Band.headerColumnsOf(7)).toBe(6 + 2 + 8 + 4 + (4 + 4 + 10 + 4))
    expect(Band.headerColumnsOf(168)).toBe(6 + 2 + 14 + 4 + (4 + 4 + 10 + 4))
  })
})
