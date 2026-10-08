import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'

describe('state-line-text-of', () => {
  const LINE = { text: "Couldn't refresh: timed out", tail: ' · last update 2 h ago' }

  test('a line that fits is drawn whole', () => {
    expect(Pane.stateLineTextOf(LINE, 80)).toBe("Couldn't refresh: timed out · last update 2 h ago")
    expect(Pane.stateLineTextOf({ text: 'Nothing saved yet.' }, 18)).toBe('Nothing saved yet.')
  })

  test('a line too wide cuts its text and keeps its tail whole', () => {
    expect(Pane.stateLineTextOf(LINE, 45)).toBe("Couldn't refresh: time… · last update 2 h ago")
  })

  test('too narrow for twenty cells of text before the tail, the whole line is cut; a line without a tail is cut at its end', () => {
    expect(Pane.stateLineTextOf(LINE, 40)).toBe("Couldn't refresh: timed out · last upda…")
    expect(Pane.stateLineTextOf({ text: 'Nothing saved yet.' }, 10)).toBe('Nothing s…')
  })
})
