import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'

describe('pane-fill-rows-of', () => {
  test("docked, the tree fills the body's rows; inline it fits its content", () => {
    expect(Pane.paneFillRowsOf('dock', 40)).toBe(40)
    expect(Pane.paneFillRowsOf('inline', 40)).toBeUndefined()
  })

  test('rows that are not a positive number fill nothing', () => {
    expect(Pane.paneFillRowsOf('dock', Number.NaN)).toBeUndefined()
    expect(Pane.paneFillRowsOf('dock', undefined as unknown as number)).toBeUndefined()
    expect(Pane.paneFillRowsOf('dock', 0)).toBeUndefined()
    expect(Pane.paneFillRowsOf('dock', 12.5)).toBe(12)
  })
})
