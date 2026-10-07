import { describe, expect, test } from 'claude-code/testing'

import Detect from '../../../hooks/deps/detect'
import Fixtures from '../../fixtures'

describe('select-deps', () => {
  const NESTED = { isRoot: false, manifestPath: 'packages/a/package.json' }

  const FOUND = [
    Fixtures.depAt('dev-nested', { ...NESTED, isDev: true }),
    Fixtures.depAt('runtime-nested-1', NESTED),
    Fixtures.depAt('dev-root', { isDev: true }),
    Fixtures.depAt('runtime-root-1'),
    Fixtures.depAt('runtime-nested-2', NESTED),
    Fixtures.depAt('runtime-root-2'),
  ]

  test('runtime before dev, root before nested, scan order within each, capped', () => {
    const all = Detect.selectDeps(FOUND, { includeDev: true, cap: 50 })
    const capped = Detect.selectDeps(FOUND, { includeDev: true, cap: 3 })

    expect(all.followed.map(dependency => dependency.name)).toEqual([
      'runtime-root-1',
      'runtime-root-2',
      'runtime-nested-1',
      'runtime-nested-2',
      'dev-root',
      'dev-nested',
    ])
    expect(capped.followed.map(dependency => dependency.name)).toEqual([
      'runtime-root-1',
      'runtime-root-2',
      'runtime-nested-1',
    ])
  })

  test('dev dependencies are left out unless included, and never push runtime ones out', () => {
    const runtime = Detect.selectDeps(FOUND, { includeDev: false, cap: 50 })

    expect(runtime.followed.map(dependency => dependency.name)).toEqual([
      'runtime-root-1',
      'runtime-root-2',
      'runtime-nested-1',
      'runtime-nested-2',
    ])
    expect(runtime.detectedCount).toBe(6)
  })

  test('a package declared in several manifests counts once: the runtime root declaration wins', () => {
    const selection = Detect.selectDeps(
      [
        Fixtures.depAt('react', { ...NESTED, versionInUse: '18.2.0' }),
        Fixtures.depAt('react', { isDev: true, versionInUse: '18.3.1' }),
        Fixtures.depAt('react', { manifestPath: 'package.json', versionInUse: '18.3.0' }),
        Fixtures.depAt('react', { ecosystem: 'pypi' }),
      ],
      { includeDev: false, cap: 50 },
    )

    expect(selection.followed).toEqual([
      Fixtures.depAt('react', { manifestPath: 'package.json', versionInUse: '18.3.0' }),
      Fixtures.depAt('react', { ecosystem: 'pypi' }),
    ])
    expect(selection.detectedCount).toBe(2)
  })

  test('a dev declaration does not hide a runtime one elsewhere', () => {
    const selection = Detect.selectDeps(
      [Fixtures.depAt('lodash', { isDev: true }), Fixtures.depAt('lodash', NESTED)],
      { includeDev: false, cap: 50 },
    )

    expect(selection.followed).toEqual([Fixtures.depAt('lodash', NESTED)])
  })

  test('a cap of zero follows nothing', () => {
    expect(Detect.selectDeps(FOUND, { includeDev: true, cap: 0 }).followed).toEqual([])
  })
})
