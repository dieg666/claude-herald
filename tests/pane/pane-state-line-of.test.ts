import { describe, expect, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'
import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('pane-state-line-of', () => {
  const TAB = { id: 'a', name: 'Alpha', label: 'Alpha', short: 'Alpha' }
  const ITEMS = Fixtures.datedItemsOf('a', 2)
  const HOUR = 3_600_000

  test('a failed refresh says why and how long ago the source last refreshed, its items listed or not', () => {
    const health = { errors: { a: 'timed out' }, refreshedAt: { a: HOUR }, now: 3 * HOUR }

    const line = { text: "Couldn't refresh: timed out", tail: ' · last update 2 h ago' }

    expect(Pane.paneStateLineOf(TAB, ITEMS, health)).toEqual(line)
    expect(Pane.paneStateLineOf(TAB, [], health)).toEqual(line)
  })

  test('a source that never refreshed cleanly, or without the clock, says only why', () => {
    expect(Pane.paneStateLineOf(TAB, [], { errors: { a: 'HTTP 503' }, now: HOUR })).toEqual({
      text: "Couldn't refresh: HTTP 503",
    })
    expect(
      Pane.paneStateLineOf(TAB, ITEMS, { errors: { a: 'HTTP 503' }, refreshedAt: { a: 0 } }),
    ).toEqual({ text: "Couldn't refresh: HTTP 503" })
  })

  test('a long reason loses the engine prefix and is cut; the time is its own part', () => {
    const line = Pane.paneStateLineOf(TAB, ITEMS, {
      errors: { a: `fetch failed: herald: $.http.fetch: ${'z'.repeat(200)}` },
      refreshedAt: { a: 0 },
      now: 5 * 60_000,
    })

    expect(line?.text).toBe(`Couldn't refresh: fetch failed: ${'z'.repeat(45)}…`)
    expect(line?.tail).toBe(' · last update 5 min ago')
  })

  test('a source with items and no failure needs no line', () => {
    expect(Pane.paneStateLineOf(TAB, ITEMS, { errors: { b: 'timed out' } })).toBeUndefined()
  })

  test('an empty source tab: loading while a run is in flight, never loaded, or loaded with nothing in its feed', () => {
    expect(Pane.paneStateLineOf(TAB, [], { errors: {}, isRefreshing: true })).toEqual({
      text: 'Loading Alpha…',
    })
    expect(Pane.paneStateLineOf(TAB, [], { errors: {}, refreshMinutes: 5 })).toEqual({
      text: 'Nothing from Alpha yet. Herald checks it every 5 min.',
    })
    expect(
      Pane.paneStateLineOf(TAB, [], { errors: {}, refreshedAt: { a: 0 }, refreshMinutes: 15 }),
    ).toEqual({ text: 'Alpha has no items right now. Herald checks it every 15 min.' })
    expect(Pane.paneStateLineOf(TAB, [], { errors: {}, refreshedAt: { a: 0 } })).toEqual({
      text: 'Alpha has no items right now.',
    })
  })

  test('prose names a factory source in full, not by its tab label', () => {
    const [sdk] = Pane.paneTabsOf(
      Defaults.FACTORY_SOURCES.filter(source => source.id === 'claude-agent-sdk-ts'),
    )

    expect(sdk?.label).toBe('Agent SDK')
    expect(Pane.paneStateLineOf(sdk!, [], { errors: {}, isRefreshing: true })).toEqual({
      text: 'Loading Claude Agent SDK (TS)…',
    })
    expect(Pane.paneStateLineOf(sdk!, [], { errors: {} })).toEqual({
      text: 'Nothing from Claude Agent SDK (TS) yet.',
    })
    expect(
      Pane.paneStateLineOf(sdk!, [], { errors: {}, refreshedAt: { 'claude-agent-sdk-ts': 0 } }),
    ).toEqual({
      text: 'Claude Agent SDK (TS) has no items right now.',
    })
  })

  test('the saved tab says how to save when empty, nothing otherwise', () => {
    const saved = { id: 'saved', name: 'Saved', label: 'Saved', short: 'Saved' }

    expect(Pane.paneStateLineOf(saved, [], { errors: {} })).toEqual({
      text: 'Nothing saved yet. Press v on an item to keep it here.',
    })
    expect(Pane.paneStateLineOf(saved, ITEMS, { errors: {} })).toBeUndefined()
  })

  test('the stack tab says why it is empty, and nothing with rows', () => {
    const stackTab = { id: '@stack', name: 'Your stack', label: 'Your stack', short: 'Your stack' }
    const stack = {
      items: [],
      filter: '',
      expanded: [],
      settings: { isEnabled: false, includeDev: false, showLevel: 'minor+' as const },
    }

    expect(Pane.paneStateLineOf(stackTab, [], { errors: {} }, stack)).toEqual({
      text: 'Your stack is off in this project. /herald deps on turns it on.',
    })
    expect(Pane.paneStateLineOf(stackTab, ITEMS, { errors: {} }, stack)).toBeUndefined()
  })
})
