import { describe, expect, test } from 'claude-code/testing'

import Composer from '../../fixtures/deps/composer'
import Fixtures from '../../fixtures'

describe('composer-detector', () => {
  const KOEL = {
    'composer.json': Composer.KOEL_COMPOSER_JSON,
    'composer.lock': Composer.KOEL_COMPOSER_LOCK,
  }

  test('require takes the composer.lock version over its range', async () => {
    const { dependencies } = await Fixtures.scanOf(KOEL)

    expect(Fixtures.depNamed(dependencies, 'laravel/framework')).toEqual({
      ecosystem: 'packagist',
      name: 'laravel/framework',
      versionInUse: 'v13.30.0',
      range: '^13.0',
      isDev: false,
      isRoot: true,
      manifestPath: 'composer.json',
    })
  })

  test('platform requirements are left out', async () => {
    const { dependencies } = await Fixtures.scanOf(KOEL)

    expect(Fixtures.depNamed(dependencies, 'php')).toBeUndefined()
    expect(dependencies.some(dependency => dependency.name.startsWith('ext-'))).toBe(false)
  })

  test('without composer.lock the range stays', async () => {
    const { dependencies } = await Fixtures.scanOf({ 'composer.json': Composer.KOEL_COMPOSER_JSON })

    expect(Fixtures.depNamed(dependencies, 'predis/predis')).toEqual({
      ecosystem: 'packagist',
      name: 'predis/predis',
      range: '~1.0',
      isDev: false,
      isRoot: true,
      manifestPath: 'composer.json',
    })
  })

  test('require-dev is left out by default and followed with the toggle', async () => {
    const runtime = await Fixtures.detectedOf(KOEL, { cap: 500 })
    const all = await Fixtures.detectedOf(KOEL, { cap: 500, includeDev: true })

    expect(
      Fixtures.depNamed(runtime.project?.dependencies ?? [], 'phpunit/phpunit'),
    ).toBeUndefined()
    expect(Fixtures.depNamed(all.project?.dependencies ?? [], 'phpunit/phpunit')).toMatchObject({
      isDev: true,
      versionInUse: '11.5.55',
    })
  })

  test('a broken composer.lock is skipped with a debug line and the ranges stay', async () => {
    const { dependencies, logs } = await Fixtures.scanOf({
      'composer.json': Composer.KOEL_COMPOSER_JSON,
      'composer.lock': Composer.BROKEN_COMPOSER_LOCK,
    })

    expect(Fixtures.depNamed(dependencies, 'laravel/framework')?.versionInUse).toBeUndefined()
    expect(Fixtures.depNamed(dependencies, 'laravel/framework')?.range).toBe('^13.0')
    expect(logs.some(line => line.startsWith('herald: deps: skipped composer.lock:'))).toBe(true)
  })
})
