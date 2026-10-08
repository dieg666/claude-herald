import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('stack-row-item-of', () => {
  test('the release a row acts on: the target for a package, its own for a release', () => {
    const jsdom = Stack.stackPackagesOf(Fixtures.STACK_RELEASES).filter(pkg => pkg.name === 'jsdom')
    const rows = Stack.stackRowsOf(jsdom, ['npm:jsdom'])

    expect(rows.map(row => Stack.stackRowItemOf(row).release.version)).toEqual([
      '30.1.2',
      '30.1.2',
      '30.1.1',
      '30.0.0',
    ])
  })

  test("a package's row acts on its highest stable release, not a later-dated backport", () => {
    const rows = Stack.stackRowsOf(
      Stack.stackPackagesOf([
        Fixtures.stackItemAt('pkg', '7.0.3', { publishedAt: '2026-10-01T00:00:00Z' }),
        Fixtures.stackItemAt('pkg', '8.0.0', { publishedAt: '2026-09-01T00:00:00Z' }),
      ]),
      [],
    )

    expect(rows.map(row => Stack.stackRowItemOf(row).release.version)).toEqual(['8.0.0'])
  })
})
