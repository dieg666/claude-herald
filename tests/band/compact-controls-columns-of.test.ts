import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'

describe('compact-controls-columns-of', () => {
  test('the name, the position with both numbers as long as the total, then p, n and the wider auto label', () => {
    // Herald, a space, 0/7; a margin; p: ◀, n: ▶ and a: ⏸ auto two cells apart.
    expect(Band.compactControlsColumnsOf(7)).toBe(6 + 1 + 3 + 2 + (4 + 2 + 4 + 2 + 10))
    expect(Band.compactControlsColumnsOf(156)).toBe(6 + 1 + 7 + 2 + (4 + 2 + 4 + 2 + 10))
    expect(Band.compactTitleColumnsOf(156)).toBe(Band.displayWidthOf('Herald 156/156'))
  })
})
