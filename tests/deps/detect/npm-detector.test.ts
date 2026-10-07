import { describe, expect, test } from 'claude-code/testing'

import Fixtures from '../../fixtures'
import Npm from '../../fixtures/deps/npm'

describe('npm-detector', () => {
  const VUE = {
    'package.json': Npm.VUE_ROOT_PACKAGE_JSON,
    'pnpm-workspace.yaml': Npm.VUE_PNPM_WORKSPACE,
    'pnpm-lock.yaml': Npm.VUE_PNPM_LOCK,
    'packages/runtime-core/package.json': Npm.VUE_RUNTIME_CORE_PACKAGE_JSON,
    'packages/compiler-sfc/package.json': Npm.VUE_COMPILER_SFC_PACKAGE_JSON,
  }

  const NPM_CLI = {
    'package.json': Npm.NPM_CLI_PACKAGE_JSON,
    'package-lock.json': Npm.NPM_CLI_PACKAGE_LOCK,
    'workspaces/arborist/package.json': Npm.NPM_CLI_ARBORIST_PACKAGE_JSON,
    'docs/package.json': Npm.NPM_CLI_DOCS_PACKAGE_JSON,
  }

  test('pnpm: a member dependency takes its importer version and a catalog range', async () => {
    const { dependencies } = await Fixtures.scanOf(VUE)
    const sfc = 'packages/compiler-sfc/package.json'

    expect(Fixtures.depNamed(dependencies, 'postcss', sfc)).toEqual({
      ecosystem: 'npm',
      name: 'postcss',
      versionInUse: '8.5.28',
      range: '^8.5.28',
      isDev: false,
      isRoot: false,
      manifestPath: sfc,
    })
    expect(Fixtures.depNamed(dependencies, '@babel/parser', sfc)).toMatchObject({
      versionInUse: '7.29.8',
      range: '^7.29.8',
    })
    expect(Fixtures.depNamed(dependencies, 'postcss-modules', sfc)?.versionInUse).toBe('6.0.1')
  })

  test('pnpm: workspace:* dependencies and the workspace packages themselves are left out', async () => {
    const { dependencies } = await Fixtures.scanOf(VUE)

    expect(dependencies.filter(dependency => dependency.name.startsWith('@vue/shared'))).toEqual([])
    expect(
      dependencies.filter(dependency => dependency.manifestPath.includes('runtime-core')),
    ).toEqual([])
  })

  test('pnpm: members are the pattern matches; other package.json files below the root declare nothing', async () => {
    const { dependencies } = await Fixtures.scanOf({
      ...VUE,
      'scripts/template/package.json': Npm.JEST_CLI_PACKAGE_JSON,
    })

    expect([...new Set(dependencies.map(dependency => dependency.manifestPath))]).toEqual([
      'package.json',
      'packages/compiler-sfc/package.json',
    ])
  })

  test('a manifest below a workspace that does not list it counts when it has its own lockfile', async () => {
    const website = { ...NPM_CLI, 'website/package.json': Npm.JEST_CLI_PACKAGE_JSON }
    const npmLock = JSON.stringify({
      lockfileVersion: 3,
      packages: { '': { name: 'jest-cli' }, 'node_modules/yargs': { version: '17.7.2' } },
    })

    const withYarn = await Fixtures.scanOf({ ...website, 'website/yarn.lock': Npm.JEST_YARN_LOCK })
    const withNpm = await Fixtures.scanOf({ ...website, 'website/package-lock.json': npmLock })
    const without = await Fixtures.scanOf(website)

    expect(Fixtures.depNamed(withYarn.dependencies, 'yargs', 'website/package.json')).toMatchObject(
      { versionInUse: '17.7.3', range: '^17.7.2' },
    )
    expect(Fixtures.depNamed(withNpm.dependencies, 'yargs', 'website/package.json')).toMatchObject({
      versionInUse: '17.7.2',
    })
    expect(
      without.dependencies.some(dependency => dependency.manifestPath.startsWith('website/')),
    ).toBe(false)
  })

  test('npm workspaces: a member reads its nested lock entry first, then the hoisted one', async () => {
    const { dependencies } = await Fixtures.scanOf(NPM_CLI)

    expect(Fixtures.depNamed(dependencies, 'jsdom', 'docs/package.json')).toMatchObject({
      versionInUse: '27.0.0',
      isDev: true,
    })
    expect(
      Fixtures.depNamed(dependencies, 'semver', 'workspaces/arborist/package.json'),
    ).toMatchObject({ versionInUse: '7.8.5', range: '^7.3.7', isDev: false, isRoot: false })
    expect(Fixtures.depNamed(dependencies, '@npmcli/arborist')).toBeUndefined()
  })

  test('the lockfile version beats the manifest range', async () => {
    const { dependencies } = await Fixtures.scanOf(NPM_CLI)

    expect(Fixtures.depNamed(dependencies, 'tap', 'package.json')).toMatchObject({
      versionInUse: '16.3.10',
      range: '^16.3.9',
    })
  })

  test('yarn classic: versions come from the descriptor the range names', async () => {
    const { dependencies } = await Fixtures.scanOf({
      'package.json': Npm.REACT_PACKAGE_JSON,
      'yarn.lock': Npm.REACT_YARN_LOCK,
      'packages/react/package.json': Npm.REACT_REACT_PACKAGE_JSON,
    })

    expect(Fixtures.depNamed(dependencies, '@babel/core')).toMatchObject({
      versionInUse: '7.24.5',
      range: '^7.11.1',
      isDev: true,
      isRoot: true,
    })
    expect(Fixtures.depNamed(dependencies, 'rollup')?.versionInUse).toBe('3.29.5')
  })

  test('yarn berry: versions come from npm: descriptors; workspace packages are left out', async () => {
    const { dependencies } = await Fixtures.scanOf({
      'package.json': Npm.JEST_PACKAGE_JSON,
      'yarn.lock': Npm.JEST_YARN_LOCK,
      'packages/jest-cli/package.json': Npm.JEST_CLI_PACKAGE_JSON,
    })

    expect(
      Fixtures.depNamed(dependencies, 'yargs', 'packages/jest-cli/package.json'),
    ).toMatchObject({ versionInUse: '17.7.3', range: '^17.7.2', isDev: false })
    expect(Fixtures.depNamed(dependencies, '@jest/globals')).toBeUndefined()
    expect(Fixtures.depNamed(dependencies, '@jest/core')).toBeUndefined()
  })

  test('without a lockfile the manifest range is kept and only an exact pin is in use', async () => {
    const { dependencies } = await Fixtures.scanOf({
      'package.json': Npm.REACT_PACKAGE_JSON,
      'packages/react/package.json': Npm.REACT_REACT_PACKAGE_JSON,
      'packages/compiler-sfc/package.json': Npm.VUE_COMPILER_SFC_PACKAGE_JSON,
    })

    expect(Fixtures.depNamed(dependencies, 'rollup')).toEqual({
      ecosystem: 'npm',
      name: 'rollup',
      range: '^3.29.5',
      isDev: true,
      isRoot: true,
      manifestPath: 'package.json',
    })
    expect(Fixtures.depNamed(dependencies, 'lru-cache')).toMatchObject({
      versionInUse: '10.1.0',
      range: '10.1.0',
    })
  })

  test('dev dependencies are left out by default and followed with the toggle', async () => {
    const runtime = await Fixtures.detectedOf(VUE, { cap: 500 })
    const all = await Fixtures.detectedOf(VUE, { cap: 500, includeDev: true })

    expect(runtime.project?.dependencies.map(dependency => dependency.name)).toEqual([
      '@babel/parser',
      'estree-walker',
      'magic-string',
      'postcss',
      'source-map-js',
    ])
    expect(Fixtures.depNamed(all.project?.dependencies ?? [], 'vitest')).toMatchObject({
      isDev: true,
      isRoot: true,
    })
  })

  test('broken manifests and lockfiles are skipped with a debug line, never thrown', async () => {
    const { dependencies, logs } = await Fixtures.scanOf({
      'package.json': Npm.REACT_PACKAGE_JSON,
      'pnpm-lock.yaml': Npm.BROKEN_PNPM_LOCK,
      'packages/react/package.json': Npm.BROKEN_PACKAGE_JSON,
    })

    expect(Fixtures.depNamed(dependencies, 'rollup')).toMatchObject({ range: '^3.29.5' })
    expect(Fixtures.depNamed(dependencies, 'rollup')?.versionInUse).toBeUndefined()
    expect(logs.some(line => /packages\/react\/package\.json/.test(line))).toBe(true)
    expect(logs.some(line => /pnpm-lock\.yaml: YAML/.test(line))).toBe(true)
  })
})
