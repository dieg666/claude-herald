import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'

describe('pane-tab-count-text-of', () => {
  const tabOf = (id: string, count?: number) => ({
    id,
    name: id,
    label: id,
    short: id,
    ...(count === undefined ? {} : { count }),
  })

  test('new items on a source tab read as a bullet and the number', () => {
    expect(Pane.paneTabCountTextOf(tabOf('a', 7))).toBe('•7')
    expect(Pane.paneTabCountTextOf(tabOf('a', 14))).toBe('•14')
  })

  test('the stack and saved tabs count a total, in parentheses, so it never reads as new items', () => {
    expect(Pane.paneTabCountTextOf(tabOf('@stack', 8))).toBe('(8)')
    expect(Pane.paneTabCountTextOf(tabOf('saved', 2))).toBe('(2)')
  })

  test('no count, no token', () => {
    expect(Pane.paneTabCountTextOf(tabOf('a'))).toBe('')
    expect(Pane.paneTabCountTextOf(tabOf('saved'))).toBe('')
  })
})
