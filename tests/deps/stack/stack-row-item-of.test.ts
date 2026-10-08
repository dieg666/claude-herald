import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('stack-row-item-of', () => {
  test('the release a row acts on: the newest for a package, its own for a release', () => {
    const jsdom = Stack.stackPackagesOf(Fixtures.STACK_RELEASES).filter(pkg => pkg.name === 'jsdom')
    const rows = Stack.stackRowsOf(jsdom, ['npm:jsdom'])

    expect(rows.map(row => Stack.stackRowItemOf(row).release.version)).toEqual([
      '30.1.2',
      '30.1.2',
      '30.1.1',
      '30.0.0',
    ])
  })
})
