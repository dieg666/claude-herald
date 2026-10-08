import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('pane-window-size-of', () => {
  const ONE = [Fixtures.sourceAt('a', { name: 'Alpha' })]

  test('the rows left after the tab row, the heading and the action row, two per item', () => {
    expect(Pane.paneWindowSizeOf(ONE, 80, 12)).toBe(4)
    expect(Pane.paneWindowSizeOf(ONE, 80, 13)).toBe(5)
    expect(Pane.paneWindowSizeOf(ONE, 80, 40)).toBe(18)
  })

  test('tab and action rows that wrap take more lines', () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      Fixtures.sourceAt(`s${i}`, { name: `Source ${i}` }),
    )

    // Thirty cells wrap the eleven tabs onto six lines and the actions onto three.
    expect(Pane.paneWindowSizeOf(many, 30, 40)).toBe(15)
  })

  test('at least one item, however little room', () => {
    expect(Pane.paneWindowSizeOf(ONE, 80, 0)).toBe(1)
  })

  test('rows that are not a number give the first window; columns that are not one count as 80', () => {
    expect(Pane.paneWindowSizeOf(ONE, 80, Number.NaN)).toBe(Pane.PANE_FIRST_WINDOW)
    expect(Pane.paneWindowSizeOf(ONE, 80, undefined as unknown as number)).toBe(
      Pane.PANE_FIRST_WINDOW,
    )
    expect(Pane.paneWindowSizeOf(ONE, Number.NaN, 12)).toBe(4)
    expect(Pane.paneWindowSizeOf(ONE, undefined as unknown as number, 12)).toBe(4)
  })
})
