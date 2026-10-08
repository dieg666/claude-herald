import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'
import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('deps-text-of', () => {
  const AT = { root: '/repo', isRepo: true }
  const projectOf = (fields: Record<string, unknown>) =>
    Store.depsProjectOf({ detectedAt: 1, ...fields })

  test('groups the followed packages by ecosystem in a fixed order, each in the order followed', () => {
    const text = Commands.depsTextOf(
      AT,
      projectOf({
        dependencies: [
          Fixtures.depAt('serde', { ecosystem: 'cargo' }),
          Fixtures.depAt('b'),
          Fixtures.depAt('a'),
        ],
      }),
      {},
    )

    expect(text.split('\n').slice(3, 8)).toEqual([
      'npm (2)',
      '  b: not looked up yet',
      '  a: not looked up yet',
      'Cargo (1)',
      '  serde: not looked up yet',
    ])
  })

  test('each status: resolved by repository or feed, tags, mapped, mapped not checked, unresolved', () => {
    const names = ['r', 'f', 't', 'm', 'n', 'u']
    const text = Commands.depsTextOf(
      AT,
      projectOf({ dependencies: names.map(name => Fixtures.depAt(name)) }),
      {
        'npm:r': { repo: 'o/r', feed: 'https://github.com/o/r/releases.atom', resolvedAt: 1 },
        'npm:f': { feed: 'https://example.org/f.xml', resolvedAt: 1 },
        'npm:t': { repo: 'o/t', feed: 'https://github.com/o/t/tags.atom', resolvedAt: 1 },
        'npm:m': { feed: 'https://example.org/m.xml', resolvedAt: 1, isOverride: true },
        'npm:n': { repo: 'o/n', resolvedAt: 1, isOverride: true },
        'npm:u': { reason: 'no repository', resolvedAt: 1 },
      },
    )

    expect(text.split('\n').slice(4, 10)).toEqual([
      '  r → o/r',
      '  f → https://example.org/f.xml',
      '  t → o/t (tags)',
      '  m → https://example.org/m.xml (mapped)',
      '  n → o/n (mapped, not checked yet)',
      '  u: unresolved, no repository',
    ])
  })

  test('names at most 200 packages and counts the rest', () => {
    const dependencies = Array.from({ length: 201 }, (_, index) => Fixtures.depAt(`p${index}`))
    const lines = Commands.depsTextOf(AT, projectOf({ dependencies }), {}).split('\n')

    expect(lines.filter(line => line.startsWith('  p')).length).toBe(200)
    expect(lines).toContain('… and 1 more')
  })
})
