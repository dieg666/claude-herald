import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'

describe('pane-span-of', () => {
  test('a list that fits shows whole', () => {
    expect(Pane.paneSpanOf(2, 3, 10)).toEqual({ start: 0, count: 3, selected: 2 })
  })

  test('the window centres on the selection and stops at both ends', () => {
    expect(Pane.paneSpanOf(0, 20, 4)).toEqual({ start: 0, count: 4, selected: 0 })
    expect(Pane.paneSpanOf(3, 20, 4)).toEqual({ start: 1, count: 4, selected: 2 })
    expect(Pane.paneSpanOf(10, 20, 5)).toEqual({ start: 8, count: 5, selected: 2 })
    expect(Pane.paneSpanOf(19, 20, 4)).toEqual({ start: 16, count: 4, selected: 3 })
  })

  test('an empty list, and a size under one, still give a sane window', () => {
    expect(Pane.paneSpanOf(0, 0, 4)).toEqual({ start: 0, count: 0, selected: 0 })
    expect(Pane.paneSpanOf(5, 10, 0)).toEqual({ start: 5, count: 1, selected: 0 })
  })
})
