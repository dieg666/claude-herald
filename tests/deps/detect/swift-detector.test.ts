import { describe, expect, test } from 'claude-code/testing'

import Fixtures from '../../fixtures'
import Swift from '../../fixtures/deps/swift'

describe('swift-detector', () => {
  const TCA = {
    'Package.swift': Swift.TCA_PACKAGE_SWIFT,
    'Package.resolved': Swift.TCA_PACKAGE_RESOLVED,
  }

  test('packages take the Package.resolved pin and keep their repository', async () => {
    const { dependencies } = await Fixtures.scanOf(TCA)

    expect(Fixtures.depNamed(dependencies, 'swift-case-paths')).toEqual({
      ecosystem: 'swift',
      name: 'swift-case-paths',
      versionInUse: '1.7.3',
      range: '^1.5.4',
      isDev: false,
      isRoot: true,
      manifestPath: 'Package.swift',
      source: 'https://github.com/pointfreeco/swift-case-paths',
    })
    expect(Fixtures.depNamed(dependencies, 'swift-perception')?.range).toBe('>=1.3.4, <3.0.0')
  })

  test('without Package.resolved the requirement stays and no version is in use', async () => {
    const { dependencies } = await Fixtures.scanOf({ 'Package.swift': Swift.VAPOR_PACKAGE_SWIFT })

    expect(Fixtures.depNamed(dependencies, 'swift-nio')).toEqual({
      ecosystem: 'swift',
      name: 'swift-nio',
      range: '^2.101.3',
      isDev: false,
      isRoot: true,
      manifestPath: 'Package.swift',
      source: 'https://github.com/apple/swift-nio.git',
    })
  })

  test('Swift has no dev dependencies: the toggle changes nothing', async () => {
    const runtime = await Fixtures.detectedOf(TCA, { cap: 500 })
    const all = await Fixtures.detectedOf(TCA, { cap: 500, includeDev: true })

    expect(runtime.project?.dependencies).toEqual(all.project?.dependencies ?? [])
    expect(runtime.project?.dependencies.length).toBe(15)
  })

  test('a broken Package.resolved is skipped with a debug line and the requirements stay', async () => {
    const { dependencies, logs } = await Fixtures.scanOf({
      ...TCA,
      'Package.resolved': Swift.BROKEN_PACKAGE_RESOLVED,
    })

    expect(Fixtures.depNamed(dependencies, 'swift-case-paths')?.versionInUse).toBeUndefined()
    expect(Fixtures.depNamed(dependencies, 'swift-case-paths')?.range).toBe('^1.5.4')
    expect(logs.some(line => line.startsWith('herald: deps: skipped Package.resolved:'))).toBe(true)
  })
})
