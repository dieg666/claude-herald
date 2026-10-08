import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('stack-packages-of', () => {
  test('releases gathered per package in first-seen order, the newest first, keyed by ecosystem and name', () => {
    const packages = Stack.stackPackagesOf(Fixtures.STACK_RELEASES)
    const jsdom = packages.find(pkg => pkg.name === 'jsdom')

    expect(packages.map(pkg => pkg.key)).toEqual([
      'npm:left-pad',
      'npm:astro',
      'npm:@astrojs/node',
      'npm:jsdom',
      'npm:@fortawesome/fontawesome-svg-core',
      'npm:lodash',
      'pypi:requests',
    ])
    expect(jsdom?.newest.release.version).toBe('30.1.2')
    expect(jsdom?.releases.map(item => item.release.version)).toEqual([
      '30.1.2',
      '30.1.1',
      '30.0.0',
    ])
  })

  test('the level is the highest among the releases', () => {
    const [mixed] = Stack.stackPackagesOf([
      Fixtures.stackItemAt('mixed', '1.0.2', { level: 'unknown' }),
      Fixtures.stackItemAt('mixed', '1.0.1', { level: 'patch' }),
      Fixtures.stackItemAt('mixed', '1.1.0', { level: 'minor' }),
    ])
    const [same] = Stack.stackPackagesOf([
      Fixtures.stackItemAt('same', '1.0.1', { level: 'unknown' }),
    ])

    expect([mixed?.level, same?.level]).toEqual(['minor', 'unknown'])
    expect(Stack.stackPackagesOf([])).toEqual([])
  })
})
