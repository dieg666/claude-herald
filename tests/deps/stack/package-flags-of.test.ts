import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('package-flags-of', () => {
  test('each flag with the oldest shown release that carries it; none when no release does', () => {
    const [pkg] = Stack.stackPackagesOf([
      Fixtures.stackItemAt('a', '3.0.0', { security: true }),
      Fixtures.stackItemAt('a', '2.1.0', { breaking: true, security: true }),
      Fixtures.stackItemAt('a', '2.0.0', { breaking: true }),
    ])
    const flags = Stack.packageFlagsOf(pkg!)

    expect([flags.security?.release.version, flags.breaking?.release.version]).toEqual([
      '2.1.0',
      '2.0.0',
    ])
    expect(
      Stack.packageFlagsOf(Stack.stackPackagesOf([Fixtures.stackItemAt('b', '1.0.0')])[0]!),
    ).toEqual({})
  })
})
