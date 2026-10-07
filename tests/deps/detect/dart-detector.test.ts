import { describe, expect, test } from 'claude-code/testing'

import Dart from '../../fixtures/deps/dart'
import Fixtures from '../../fixtures'

describe('dart-detector', () => {
  const IMMICH = { 'pubspec.yaml': Dart.IMMICH_PUBSPEC, 'pubspec.lock': Dart.IMMICH_PUBSPEC_LOCK }

  const NATIVE = {
    'pubspec.yaml': Dart.DART_NATIVE_PUBSPEC,
    'pkgs/code_assets/pubspec.yaml': Dart.DART_NATIVE_CODE_ASSETS_PUBSPEC,
    'pkgs/hooks/pubspec.yaml': Dart.DART_NATIVE_HOOKS_PUBSPEC,
  }

  test('dependencies take the pubspec.lock version; SDK and path entries are left out', async () => {
    const { dependencies } = await Fixtures.scanOf(IMMICH)

    expect(Fixtures.depNamed(dependencies, 'http')).toEqual({
      ecosystem: 'pub',
      name: 'http',
      versionInUse: '1.6.0',
      range: '^1.6.0',
      isDev: false,
      isRoot: true,
      manifestPath: 'pubspec.yaml',
    })
    expect(Fixtures.depNamed(dependencies, 'flutter')).toBeUndefined()
    expect(Fixtures.depNamed(dependencies, 'immich_ui')).toBeUndefined()
    expect(Fixtures.depNamed(dependencies, 'native_video_player')).toMatchObject({
      source: 'https://github.com/immich-app/native_video_player',
    })
  })

  test('pub workspace members are read and their own packages are not followed', async () => {
    const { dependencies } = await Fixtures.scanOf(NATIVE)

    expect(
      Fixtures.depNamed(dependencies, 'collection', 'pkgs/code_assets/pubspec.yaml'),
    ).toMatchObject({ range: '^1.19.1', isRoot: false })
    expect(Fixtures.depNamed(dependencies, 'hooks')).toBeUndefined()
    expect(Fixtures.depNamed(dependencies, 'code_assets')).toBeUndefined()
  })

  test('without pubspec.lock ranges stay and exact versions are in use', async () => {
    const { dependencies } = await Fixtures.scanOf({ 'pubspec.yaml': Dart.IMMICH_PUBSPEC })

    expect(Fixtures.depNamed(dependencies, 'http')?.versionInUse).toBeUndefined()
    expect(Fixtures.depNamed(dependencies, 'photo_manager')).toMatchObject({
      range: '3.9.0',
      versionInUse: '3.9.0',
    })
  })

  test('dev_dependencies are left out by default and followed with the toggle', async () => {
    const runtime = await Fixtures.detectedOf(IMMICH, { cap: 500 })
    const all = await Fixtures.detectedOf(IMMICH, { cap: 500, includeDev: true })

    expect(Fixtures.depNamed(runtime.project?.dependencies ?? [], 'build_runner')).toBeUndefined()
    expect(Fixtures.depNamed(all.project?.dependencies ?? [], 'build_runner')).toMatchObject({
      isDev: true,
      versionInUse: '2.15.1',
    })
  })

  test('a broken pubspec.yaml is skipped with a debug line, never thrown', async () => {
    const { dependencies, logs } = await Fixtures.scanOf({
      'pubspec.yaml': Dart.BROKEN_PUBSPEC,
      'pubspec.lock': Dart.IMMICH_PUBSPEC_LOCK,
    })

    expect(dependencies).toEqual([])
    expect(logs.some(line => /skipped pubspec\.yaml: YAML/.test(line))).toBe(true)
  })
})
