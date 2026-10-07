import { describe, expect, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'
import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('load-deps-project', () => {
  const EMPTY = {
    settings: Defaults.DEFAULT_DEPS_SETTINGS,
    dependencies: [],
    detectedCount: 0,
    manifestHashes: {},
  }

  test('a project never detected reads as an empty record with default settings', async () => {
    const { host } = Fixtures.fakeHostOf({ deps: { '/other': { detectedCount: 3 } } })

    expect(await Store.loadDepsProject(host, '/repo')).toEqual(EMPTY)
  })

  test('a stored record is cleaned: bad dependencies and hashes dropped', async () => {
    const { host } = Fixtures.fakeHostOf({
      deps: {
        '/repo': {
          settings: { cap: 5 },
          dependencies: [Fixtures.depAt('react'), { name: 'broken' }],
          detectedCount: 2,
          manifestHashes: { 'package.json': 'h', 'yarn.lock': 7 },
        },
      },
    })

    expect(await Store.loadDepsProject(host, '/repo')).toEqual({
      settings: { ...Defaults.DEFAULT_DEPS_SETTINGS, cap: 5 },
      dependencies: [Fixtures.depAt('react')],
      detectedCount: 2,
      manifestHashes: { 'package.json': 'h' },
    })
  })

  test('a store value that is not an object, or a root named like a built-in key, reads as empty', async () => {
    expect(await Store.loadDepsProject(Fixtures.fakeHostOf({ deps: [1] }).host, '/repo')).toEqual(
      EMPTY,
    )
    expect(
      await Store.loadDepsProject(Fixtures.fakeHostOf({ deps: {} }).host, 'constructor'),
    ).toEqual(EMPTY)
  })
})
