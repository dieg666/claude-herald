import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('pane-window-size-of', () => {
  const ONE = [Fixtures.sourceAt('a', { name: 'Alpha' })]

  test("the rows left after the tab row, the heading, the footer and the selected item's three summary lines, one per item", () => {
    // At 80 cells the widest footer, Your stack's after the focus hint, takes two lines.
    expect(Pane.paneWindowSizeOf(ONE, 80, 12)).toBe(5)
    expect(Pane.paneWindowSizeOf(ONE, 80, 13)).toBe(6)
    expect(Pane.paneWindowSizeOf(ONE, 80, 40)).toBe(33)
    // From 100 cells the hint and every key fit one line.
    expect(Pane.paneWindowSizeOf(ONE, 100, 12)).toBe(6)
    expect(Pane.paneWindowSizeOf(ONE, 99, 12)).toBe(5)
  })

  test('tab rows and footers that wrap take more lines', () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      Fixtures.sourceAt(`s${i}`, { name: `Source ${i}` }),
    )

    // Thirty cells wrap the eleven tabs onto six lines and the widest footer onto four.
    expect(Pane.paneWindowSizeOf(many, 30, 40)).toBe(26)
  })

  test("the footer counts as the widest a tab draws, the focus hint and the stack tab's releases toggle included", () => {
    // At 35 cells Your stack's footer takes four lines: the hint, `o: Open  s: Summarize  v: Saved`, `c: Copy for Claude`, `e: Hide releases`.
    expect(Pane.paneWindowSizeOf(ONE, 35, 12)).toBe(3)
  })

  test('the tab row is spelled as drawn, the counts included: one line where it fits, two where it wraps', () => {
    const sources = [...ONE, Fixtures.sourceAt('long', { name: 'Claude Code releases' })]
    const saved = [1, 2].map(n => ({ ...Fixtures.itemAt(`k${n}`), savedAt: n }))
    const stack = { items: Fixtures.STACK_RELEASES, filter: '', expanded: [] }

    // Full, `1: Alpha  2: Claude Code releases  0: Saved 2` is forty-five cells and fits one line.
    expect(Pane.paneWindowSizeOf(sources, 45, 20, undefined, saved)).toBe(12)
    // Cut, it is forty-one cells, one line where the full names take two; the footer takes three lines from forty cells to fifty-one.
    expect(Pane.paneWindowSizeOf(sources, 41, 20, undefined, saved)).toBe(12)
    expect(Pane.paneWindowSizeOf(sources, 40, 20, undefined, saved)).toBe(11)
    expect(Pane.paneWindowSizeOf(sources, 40, 20)).toBe(12)
    // `y: Your stack 7` adds seventeen cells with its gap; from fifty-two cells the footer takes two lines.
    expect(Pane.paneWindowSizeOf(sources, 58, 20, stack, saved)).toBe(13)
    expect(Pane.paneWindowSizeOf(sources, 57, 20, stack, saved)).toBe(12)
  })

  test("the source tabs' new counts are spelled as drawn too, so a count that wraps the tab row takes a line", () => {
    // `1: Alpha  0: Saved` is eighteen cells; `1: Alpha 14  0: Saved` is twenty-one.
    expect(Pane.paneWindowSizeOf(ONE, 21, 40, undefined, [], { a: 14 })).toBe(
      Pane.paneWindowSizeOf(ONE, 21, 40),
    )
    expect(Pane.paneWindowSizeOf(ONE, 20, 40, undefined, [], { a: 14 })).toBe(
      Pane.paneWindowSizeOf(ONE, 20, 40) - 1,
    )
  })

  test('at least one item, however little room', () => {
    expect(Pane.paneWindowSizeOf(ONE, 80, 0)).toBe(1)
  })

  test('rows that are not a number give the first window; columns that are not one count as 80', () => {
    expect(Pane.paneWindowSizeOf(ONE, 80, Number.NaN)).toBe(Pane.PANE_FIRST_WINDOW)
    expect(Pane.paneWindowSizeOf(ONE, 80, undefined as unknown as number)).toBe(
      Pane.PANE_FIRST_WINDOW,
    )
    expect(Pane.paneWindowSizeOf(ONE, Number.NaN, 12)).toBe(5)
    expect(Pane.paneWindowSizeOf(ONE, undefined as unknown as number, 12)).toBe(5)
  })
})
