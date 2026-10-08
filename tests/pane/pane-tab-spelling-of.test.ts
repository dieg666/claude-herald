import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'

describe('pane-tab-spelling-of', () => {
  test('the hotkey, a colon and the name, as the terminal spells a plain Button', () => {
    expect(
      Pane.paneTabSpellingOf({
        id: 'a',
        name: 'Alpha',
        label: 'Alpha',
        short: 'Alpha',
        hotkey: '1',
      }),
    ).toBe('1: Alpha')
  })

  test('the count is a token of its own, never part of the spelling', () => {
    expect(
      Pane.paneTabSpellingOf({
        id: 'saved',
        name: 'Saved',
        label: 'Saved',
        short: 'Saved',
        hotkey: '0',
        count: 2,
      }),
    ).toBe('0: Saved')
  })

  test('without a hotkey, the name alone', () => {
    expect(Pane.paneTabSpellingOf({ id: 's10', name: 's10', label: 's10', short: 's10' })).toBe(
      's10',
    )
    expect(
      Pane.paneTabSpellingOf({ id: 's10', name: 's10', label: 's10', short: 's10', count: 3 }),
    ).toBe('s10')
  })
})
