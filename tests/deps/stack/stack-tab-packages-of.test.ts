import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('stack-tab-packages-of', () => {
  const namesOf = (packages: readonly { name: string }[]) => packages.map(pkg => pkg.name)

  test('one entry per package, grouped by ecosystem in a fixed order', () => {
    const cargo = Fixtures.stackItemAt('serde', '2.0.0', { ecosystem: 'cargo' })
    const packages = Stack.stackTabPackagesOf([cargo, ...Fixtures.STACK_RELEASES], '')

    expect(namesOf(packages)).toEqual([
      '@astrojs/node',
      'jsdom',
      'astro',
      '@fortawesome/fontawesome-svg-core',
      'lodash',
      'left-pad',
      'requests',
      'serde',
    ])
    expect(packages.find(pkg => pkg.name === 'jsdom')?.releases.length).toBe(3)
  })

  test('inside a group: flagged first, then major, minor, patch and unknown, then the newest date first', () => {
    const at = (name: string, fields: Parameters<typeof Fixtures.stackItemAt>[2]) =>
      Fixtures.stackItemAt(name, '2.0.0', fields)
    const items = [
      at('unknown', { level: 'unknown', publishedAt: '2026-01-09T00:00:00Z' }),
      at('patch', { level: 'patch', publishedAt: '2026-01-08T00:00:00Z' }),
      at('minor', { level: 'minor', publishedAt: '2026-01-07T00:00:00Z' }),
      at('major-new', { level: 'major', publishedAt: '2026-01-06T00:00:00Z' }),
      at('major-old', { level: 'major', publishedAt: '2026-01-01T00:00:00Z' }),
      at('flagged-patch', { level: 'patch', security: true, publishedAt: '2026-01-05T00:00:00Z' }),
      at('flagged-major', { level: 'major', breaking: true, publishedAt: '2026-01-02T00:00:00Z' }),
      at('undated', { level: 'major' }),
    ]

    expect(namesOf(Stack.stackTabPackagesOf(items, ''))).toEqual([
      'flagged-major',
      'flagged-patch',
      'major-new',
      'major-old',
      'undated',
      'minor',
      'patch',
      'unknown',
    ])
  })

  test('only the packages matching the filter', () => {
    expect(namesOf(Stack.stackTabPackagesOf(Fixtures.STACK_SAMPLE, 're'))).toEqual([
      'react',
      'next',
      'requests',
    ])
    expect(namesOf(Stack.stackTabPackagesOf(Fixtures.STACK_RELEASES, 'breaking'))).toEqual([
      'jsdom',
    ])
  })
})
