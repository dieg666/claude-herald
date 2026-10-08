import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'

describe('pane-tab-spelling-of', () => {
  test('the hotkey, a colon and the text, as the terminal spells a plain Button', () => {
    expect(
      Pane.paneTabSpellingOf({
        id: 'a',
        name: 'Alpha',
        label: 'Alpha',
        short: 'Alpha',
        hotkey: '1',
      }),
    ).toBe('1: Alpha')
    expect(
      Pane.paneTabSpellingOf({
        id: 'saved',
        name: 'Saved',
        label: 'Saved',
        short: 'Saved',
        hotkey: '0',
        count: 2,
      }),
    ).toBe('0: Saved 2')
  })

  test('without a hotkey, the text alone', () => {
    expect(Pane.paneTabSpellingOf({ id: 's10', name: 's10', label: 's10', short: 's10' })).toBe(
      's10',
    )
    expect(
      Pane.paneTabSpellingOf({ id: 's10', name: 's10', label: 's10', short: 's10', count: 3 }),
    ).toBe('s10 3')
  })
})
