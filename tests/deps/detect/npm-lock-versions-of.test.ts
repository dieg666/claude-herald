import { describe, expect, test } from 'claude-code/testing'

import Detect from '../../../hooks/deps/detect'

describe('npm-lock-versions-of', () => {
  const V3 = JSON.stringify({
    name: 'root',
    lockfileVersion: 3,
    packages: {
      '': { name: 'root', workspaces: ['packages/*'] },
      'node_modules/semver': { version: '7.6.3' },
      'node_modules/a': { resolved: 'packages/a', link: true },
      'node_modules/local': { version: 'file:../local' },
      'packages/a': { name: 'a', version: '1.0.0' },
      'packages/a/node_modules/semver': { version: '6.3.1' },
    },
  })

  const V1 = JSON.stringify({
    name: 'legacy',
    lockfileVersion: 1,
    dependencies: {
      lodash: { version: '4.17.21' },
      local: { version: 'file:../local' },
    },
  })

  test('the root package reads the hoisted entry', () => {
    expect(Detect.npmLockVersionsOf(V3)('', 'semver')).toBe('7.6.3')
  })

  test('a member reads its nested entry first, then the hoisted one', () => {
    const lookup = Detect.npmLockVersionsOf(V3)

    expect(lookup('packages/a', 'semver')).toBe('6.3.1')
    expect(lookup('packages/b', 'semver')).toBe('7.6.3')
  })

  test('links and local paths are not versions; an unknown package has none', () => {
    const lookup = Detect.npmLockVersionsOf(V3)

    expect(lookup('', 'a')).toBeUndefined()
    expect(lookup('', 'local')).toBeUndefined()
    expect(lookup('', 'missing')).toBeUndefined()
  })

  test('a v1 lockfile answers from its dependencies for the root only', () => {
    const lookup = Detect.npmLockVersionsOf(V1)

    expect(lookup('', 'lodash')).toBe('4.17.21')
    expect(lookup('', 'local')).toBeUndefined()
    expect(lookup('packages/a', 'lodash')).toBeUndefined()
  })

  test('a file that is not JSON throws', () => {
    expect(() => Detect.npmLockVersionsOf('lockfileVersion: 3')).toThrow()
  })
})
