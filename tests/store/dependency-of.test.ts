import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'

describe('dependency-of', () => {
  const WHOLE = {
    ecosystem: 'cargo',
    name: 'serde',
    versionInUse: '1.0.200',
    range: '1.0',
    isDev: false,
    isRoot: true,
    manifestPath: 'Cargo.toml',
    source: 'https://github.com/serde-rs/serde',
  }

  test('a whole stored dependency reads back as stored, unknown fields dropped', () => {
    expect(Store.dependencyOf({ ...WHOLE, extra: 1 })).toEqual(WHOLE)
  })

  test('an unknown ecosystem, a blank name or a missing manifest path is not a dependency', () => {
    expect(Store.dependencyOf({ ...WHOLE, ecosystem: 'cpan' })).toBeUndefined()
    expect(Store.dependencyOf({ ...WHOLE, name: ' ' })).toBeUndefined()
    expect(Store.dependencyOf({ ...WHOLE, manifestPath: 3 })).toBeUndefined()
    expect(Store.dependencyOf('serde')).toBeUndefined()
  })

  test('optional fields are left out when not strings; flags default to false', () => {
    expect(
      Store.dependencyOf({ ecosystem: 'npm', name: 'a', manifestPath: 'package.json', range: 2 }),
    ).toEqual({
      ecosystem: 'npm',
      name: 'a',
      isDev: false,
      isRoot: false,
      manifestPath: 'package.json',
    })
  })
})
