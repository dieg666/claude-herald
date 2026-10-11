import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'

describe('failure-text-of', () => {
  test('a throw says what was thrown, on one line, capped', () => {
    expect(Commands.failureTextOf({ kind: 'throw', message: 'store\n  unavailable' }, 'list')).toBe(
      '/herald failed: store unavailable.',
    )
    expect(Commands.failureTextOf({ kind: 'throw' }, 'list')).toBe(
      '/herald failed: an unexpected error.',
    )
    expect(
      Commands.failureTextOf({ kind: 'throw', message: 'x'.repeat(500) }, 'list'),
    ).not.toContain('x'.repeat(201))
  })

  test('a timeout and a re-entry are put in plain words, whatever the engine said', () => {
    expect(Commands.failureTextOf({ kind: 'timeout', message: 'aborted' }, 'list')).toBe(
      '/herald failed: it took too long and was stopped.',
    )
    expect(Commands.failureTextOf({ kind: 're-entry' }, 'list')).toBe(
      '/herald failed: it was called again while it was still running.',
    )
  })

  test('several pasted commands add that those before the failure may have applied, and where to look', () => {
    const text = Commands.failureTextOf(
      { kind: 'timeout' },
      'add https://a.example/x.xml\n/herald disable x',
    )

    expect(text).toBe(
      '/herald failed: it took too long and was stopped. Commands pasted before the failure may already have applied; /herald list shows the current state.',
    )
    expect(text).not.toContain('\n')
  })

  test('one command spread over several lines is not a paste', () => {
    expect(Commands.failureTextOf({ kind: 'timeout' }, 'template Read this\n{title}\n{url}')).toBe(
      '/herald failed: it took too long and was stopped.',
    )
  })
})
