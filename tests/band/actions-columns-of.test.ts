import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'

describe('actions-columns-of', () => {
  test('the four actions at the longer save label, then the up and down Buttons set apart by a margin', () => {
    // `o: Open`, `s: Summarize`, `v: Saved`, `c: Copy for Claude`, three gaps, a gap and a margin, then `k: ↑`, `j: ↓` and a gap.
    expect(Band.actionsColumnsOf()).toBe(7 + 12 + 8 + 18 + 6 + 4 + (4 + 4 + 2))
    expect(Band.actionsColumnsOf()).toBe(65)
  })
})
