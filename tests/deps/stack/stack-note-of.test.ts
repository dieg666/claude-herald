import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('stack-note-of', () => {
  test('the ecosystem, the level and the flags', () => {
    const [react, vite, , requests, next] = Fixtures.STACK_SAMPLE

    expect(Stack.stackNoteOf(react!.release)).toBe('npm · major · breaking')
    expect(Stack.stackNoteOf(vite!.release)).toBe('npm · minor')
    expect(Stack.stackNoteOf(requests!.release)).toBe('PyPI · patch · security')
    expect(Stack.stackNoteOf(next!.release)).toBe('npm · major · pre-release')
    expect(Stack.stackNoteOf({ ...vite!.release, level: 'unknown' })).toBe('npm')
  })
})
