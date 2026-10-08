import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('stack-rows-of', () => {
  test('a row per package; an expanded one followed by a row per release, newest first; unknown keys ignored', () => {
    const shape = (rows: ReturnType<typeof Stack.stackRowsOf>) =>
      rows.map(row => (row.kind === 'package' ? row.pkg.name : `  ${row.item.release.version}`))
    const two = Stack.stackPackagesOf(Fixtures.STACK_RELEASES).slice(2, 4)

    expect(shape(Stack.stackRowsOf(two, []))).toEqual(['@astrojs/node', 'jsdom'])
    expect(shape(Stack.stackRowsOf(two, ['npm:jsdom', 'npm:gone']))).toEqual([
      '@astrojs/node',
      'jsdom',
      '  30.1.2',
      '  30.1.1',
      '  30.0.0',
    ])
  })
})
