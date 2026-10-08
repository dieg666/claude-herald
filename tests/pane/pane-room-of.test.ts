import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'

describe('pane-room-of', () => {
  test('a whole number of items, at least one', () => {
    expect(Pane.paneRoomOf(4.9)).toBe(4)
    expect(Pane.paneRoomOf(0)).toBe(1)
    expect(Pane.paneRoomOf(-3)).toBe(1)
  })

  test('a size that is not a finite number is the first window', () => {
    for (const size of [Number.NaN, Number.POSITIVE_INFINITY, undefined as unknown as number]) {
      expect(Pane.paneRoomOf(size)).toBe(Pane.PANE_FIRST_WINDOW)
    }
  })
})
