import { describe, expect, test } from 'claude-code/testing'

import Cargo from '../../fixtures/deps/cargo'
import Fixtures from '../../fixtures'

describe('cargo-detector', () => {
  const HELIX = {
    'Cargo.toml': Cargo.HELIX_CARGO_TOML,
    'Cargo.lock': Cargo.HELIX_CARGO_LOCK,
    'helix-core/Cargo.toml': Cargo.HELIX_CORE_CARGO_TOML,
  }

  const RIPGREP = {
    'Cargo.toml': Cargo.RIPGREP_CARGO_TOML,
    'Cargo.lock': Cargo.RIPGREP_CARGO_LOCK,
    'crates/grep/Cargo.toml': Cargo.RIPGREP_GREP_CARGO_TOML,
  }

  test('a root package takes Cargo.lock versions over its ranges', async () => {
    const { dependencies } = await Fixtures.scanOf(RIPGREP)

    expect(Fixtures.depNamed(dependencies, 'anyhow')).toEqual({
      ecosystem: 'cargo',
      name: 'anyhow',
      versionInUse: '1.0.104',
      range: '1.0.75',
      isDev: false,
      isRoot: true,
      manifestPath: 'Cargo.toml',
    })
  })

  test('target tables count, path dependencies (the workspace crates) do not', async () => {
    const { dependencies } = await Fixtures.scanOf(RIPGREP)

    expect(Fixtures.depNamed(dependencies, 'tikv-jemallocator')).toMatchObject({
      versionInUse: '0.7.0',
      isDev: false,
    })
    expect(Fixtures.depNamed(dependencies, 'grep')).toBeUndefined()
    expect(Fixtures.depNamed(dependencies, 'grep-cli')).toBeUndefined()
    expect(Fixtures.depNamed(dependencies, 'walkdir', 'crates/grep/Cargo.toml')).toMatchObject({
      versionInUse: '2.5.0',
      isDev: true,
    })
  })

  test('workspace members inherit [workspace.dependencies] ranges and the root Cargo.lock', async () => {
    const { dependencies } = await Fixtures.scanOf(HELIX)

    expect(Fixtures.depNamed(dependencies, 'ropey')).toEqual({
      ecosystem: 'cargo',
      name: 'ropey',
      versionInUse: '1.6.1',
      range: '1.6.1',
      isDev: false,
      isRoot: false,
      manifestPath: 'helix-core/Cargo.toml',
    })
    expect(Fixtures.depNamed(dependencies, 'tree-house')).toMatchObject({
      range: '0.4',
      versionInUse: '0.4.0',
    })
    expect(Fixtures.depNamed(dependencies, 'quickcheck')?.isDev).toBe(true)
  })

  test('when Cargo.lock holds several versions, the one matching the requirement is in use', async () => {
    const { dependencies } = await Fixtures.scanOf({
      ...HELIX,
      'helix-core/Cargo.toml': `[package]\nname = "probe"\n\n[dependencies]\nwindows-sys = "0.52"\n`,
    })
    const lock = Cargo.HELIX_CARGO_LOCK.match(/name = "windows-sys"\nversion = "([^"]+)"/g) ?? []

    expect(lock.length > 1).toBe(true)
    expect(Fixtures.depNamed(dependencies, 'windows-sys')?.versionInUse).toMatch(/^0\.52\./)
  })

  test('without Cargo.lock only `=` requirements are in use', async () => {
    const { dependencies } = await Fixtures.scanOf({
      'Cargo.toml': Cargo.HELIX_CARGO_TOML,
      'helix-core/Cargo.toml': Cargo.HELIX_CORE_CARGO_TOML,
    })

    expect(Fixtures.depNamed(dependencies, 'ropey')?.versionInUse).toBeUndefined()
    expect(Fixtures.depNamed(dependencies, 'unicode-width')).toMatchObject({
      range: '=0.1.12',
      versionInUse: '0.1.12',
    })
  })

  test('dev and build dependencies are left out by default and followed with the toggle', async () => {
    const runtime = await Fixtures.detectedOf(RIPGREP, { cap: 500 })
    const all = await Fixtures.detectedOf(RIPGREP, { cap: 500, includeDev: true })

    expect(runtime.project?.dependencies.some(dependency => dependency.isDev)).toBe(false)
    expect(Fixtures.depNamed(all.project?.dependencies ?? [], 'serde')?.isDev).toBe(true)
  })

  test('a broken Cargo.toml is skipped with a debug line, never thrown', async () => {
    const { dependencies, logs } = await Fixtures.scanOf({
      ...RIPGREP,
      'crates/grep/Cargo.toml': Cargo.BROKEN_CARGO_TOML,
    })

    expect(Fixtures.depNamed(dependencies, 'anyhow')?.versionInUse).toBe('1.0.104')
    expect(dependencies.some(dependency => dependency.manifestPath !== 'Cargo.toml')).toBe(false)
    expect(logs.some(line => /skipped crates\/grep\/Cargo\.toml: TOML/.test(line))).toBe(true)
  })
})
