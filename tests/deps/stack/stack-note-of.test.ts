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

  test("a package's row names the release that brought a flag and counts its releases", () => {
    const [pkg] = Stack.stackPackagesOf(Fixtures.STACK_MIDDLE)
    const { target } = pkg!
    const { rollup } = Stack.stackPackageItemOf(pkg!)

    expect(Stack.stackNoteOf(target.release, rollup)).toBe(
      'npm · major · breaking in 4.6.3 · 4 releases',
    )
    expect(Stack.stackNoteOf(target.release, { releases: 1 })).toBe('npm · major')
    expect(
      Stack.stackNoteOf(
        { ...target.release, security: true },
        { releases: 2, securityIn: '4.6.0' },
      ),
    ).toBe('npm · major · security in 4.6.0 · 2 releases')
    expect(Stack.stackNoteOf({ ...target.release, breaking: true }, { releases: 2 })).toBe(
      'npm · major · breaking · 2 releases',
    )
  })
})
