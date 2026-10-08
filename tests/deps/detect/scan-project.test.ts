import { describe, expect, test } from 'claude-code/testing'

import Detect from '../../../hooks/deps/detect'
import Cargo from '../../fixtures/deps/cargo'
import Fixtures from '../../fixtures'
import Npm from '../../fixtures/deps/npm'

describe('scan-project', () => {
  test('a monorepo with package.json and Cargo.toml yields both ecosystems', async () => {
    const { dependencies } = await Fixtures.scanOf({
      'package.json': Npm.REACT_PACKAGE_JSON,
      'yarn.lock': Npm.REACT_YARN_LOCK,
      'Cargo.toml': Cargo.RIPGREP_CARGO_TOML,
      'Cargo.lock': Cargo.RIPGREP_CARGO_LOCK,
    })

    expect(Fixtures.depNamed(dependencies, 'rollup')).toMatchObject({
      ecosystem: 'npm',
      versionInUse: '3.29.5',
    })
    expect(Fixtures.depNamed(dependencies, 'anyhow')).toMatchObject({
      ecosystem: 'cargo',
      versionInUse: '1.0.104',
    })
  })

  test('a lockfile over 4 MiB is never read: skipped as broken, the ranges stay', async () => {
    const { dependencies, reads, logs } = await Fixtures.scanOf({
      'package.json': Npm.REACT_PACKAGE_JSON,
      'yarn.lock': { text: Npm.REACT_YARN_LOCK, size: 5 * 1024 * 1024 },
    })

    expect(reads).toEqual(['/repo/package.json'])
    expect(logs).toEqual(['herald: deps: skipped yarn.lock: larger than 4 MiB'])
    expect(Fixtures.depNamed(dependencies, 'rollup')).toMatchObject({ range: '^3.29.5' })
    expect(Fixtures.depNamed(dependencies, 'rollup')?.versionInUse).toBeUndefined()
  })

  test('a lockfile the engine refuses to read is skipped as broken, the ranges stay', async () => {
    const fake = Fixtures.fakeHostOf()
    const fs = Fixtures.fakeFsOf('/repo', {
      'package.json': Npm.REACT_PACKAGE_JSON,
      'yarn.lock': Npm.REACT_YARN_LOCK,
    })

    Object.assign(fake.host, fs, {
      readText: async (path: string) => {
        if (path.endsWith('yarn.lock')) {
          throw new Error('EFBIG: over 4 MiB')
        }

        return fs.readText(path)
      },
    })

    const scan = await Detect.scanProject(fake.host, '/repo')

    expect(Fixtures.depNamed(scan.dependencies, 'rollup')?.versionInUse).toBeUndefined()
    expect(fake.logs).toEqual(['herald: deps: skipped yarn.lock: EFBIG: over 4 MiB'])
    expect([...scan.texts.keys()]).toEqual(['package.json'])
  })

  test('a parser that throws is logged and the other ecosystems still count', async () => {
    const fake = Fixtures.fakeHostOf()

    Object.assign(
      fake.host,
      Fixtures.fakeFsOf('/repo', { 'package.json': Npm.REACT_PACKAGE_JSON, 'go.mod': 'module x' }),
    )

    const failing = {
      isManifest: (name: string) => name === 'go.mod',
      isCompanion: () => false,
      workspacesOf: () => [],
      depsOf: () => {
        throw new Error('boom')
      },
    }
    const scan = await Detect.scanProject(fake.host, '/repo', [failing, Detect.NPM_DETECTOR])

    expect(Fixtures.depNamed(scan.dependencies, 'rollup')).toBeDefined()
    expect(fake.logs).toEqual(['herald: deps: a parser failed: boom'])
  })

  test('the texts are every manifest, lockfile and workspace file read', async () => {
    const { texts } = await Fixtures.scanOf({
      'package.json': Npm.VUE_ROOT_PACKAGE_JSON,
      'pnpm-workspace.yaml': Npm.VUE_PNPM_WORKSPACE,
      'pnpm-lock.yaml': Npm.VUE_PNPM_LOCK,
      'README.md': '# vue',
      'packages/compiler-sfc/package.json': Npm.VUE_COMPILER_SFC_PACKAGE_JSON,
    })

    expect([...texts.keys()]).toEqual([
      'package.json',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
      'packages/compiler-sfc/package.json',
    ])
  })

  test('a workspace that names no members restricts nothing below it', async () => {
    const { dependencies } = await Fixtures.scanOf({
      'Cargo.toml': Cargo.HELIX_CARGO_TOML.replace(/members = \[[^\]]*\]/, 'members = []'),
      'helix-core/Cargo.toml': Cargo.HELIX_CORE_CARGO_TOML,
      'pnpm-workspace.yaml': 'catalog:\n  react: ^18.3.0\n',
      'package.json': Npm.NPM_CLI_ARBORIST_PACKAGE_JSON,
      'web/package.json': Npm.JEST_CLI_PACKAGE_JSON,
    })

    expect(Fixtures.depNamed(dependencies, 'ropey')?.manifestPath).toBe('helix-core/Cargo.toml')
    expect(Fixtures.depNamed(dependencies, 'yargs')?.manifestPath).toBe('web/package.json')
  })
})
