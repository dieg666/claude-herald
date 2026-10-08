import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('pane-window-size-of', () => {
  const ONE = [Fixtures.sourceAt('a', { name: 'Alpha' })]

  test("the rows left after the tab row, the heading, the action row and the selected item's three summary lines, one per item", () => {
    expect(Pane.paneWindowSizeOf(ONE, 80, 12)).toBe(6)
    expect(Pane.paneWindowSizeOf(ONE, 80, 13)).toBe(7)
    expect(Pane.paneWindowSizeOf(ONE, 80, 40)).toBe(34)
  })

  test('tab and action rows that wrap take more lines', () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      Fixtures.sourceAt(`s${i}`, { name: `Source ${i}` }),
    )

    // Thirty cells wrap the eleven tabs onto six lines and the actions onto three.
    expect(Pane.paneWindowSizeOf(many, 30, 40)).toBe(27)
  })

  test("the action row counts as the widest a tab draws, the stack tab's releases toggle included", () => {
    // At 35 cells `r: Mark as read` still fits on the second action line, `e: Hide releases` wraps to a third.
    expect(Pane.paneWindowSizeOf(ONE, 35, 12)).toBe(4)
  })

  test('at least one item, however little room', () => {
    expect(Pane.paneWindowSizeOf(ONE, 80, 0)).toBe(1)
  })

  test('rows that are not a number give the first window; columns that are not one count as 80', () => {
    expect(Pane.paneWindowSizeOf(ONE, 80, Number.NaN)).toBe(Pane.PANE_FIRST_WINDOW)
    expect(Pane.paneWindowSizeOf(ONE, 80, undefined as unknown as number)).toBe(
      Pane.PANE_FIRST_WINDOW,
    )
    expect(Pane.paneWindowSizeOf(ONE, Number.NaN, 12)).toBe(6)
    expect(Pane.paneWindowSizeOf(ONE, undefined as unknown as number, 12)).toBe(6)
  })
})
