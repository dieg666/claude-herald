import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'

describe('pane-tab-text-of', () => {
  test('the name, then the count when there is one', () => {
    expect(Pane.paneTabTextOf({ id: 'saved', label: 'Saved', short: 'Saved', count: 2 })).toBe(
      'Saved 2',
    )
    expect(Pane.paneTabTextOf({ id: 'saved', label: 'Saved', short: 'Saved' })).toBe('Saved')
  })

  test('tabs with nothing to count carry no count and draw none', () => {
    const tabs = Pane.paneTabsOf([], { items: [], filter: '', expanded: [] }, [])

    expect(tabs.map(tab => Object.hasOwn(tab, 'count'))).toEqual([false, false])
    expect(tabs.map(tab => Pane.paneTabTextOf(tab))).toEqual(['Your stack', 'Saved'])
  })
})
