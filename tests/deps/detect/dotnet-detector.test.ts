import { describe, expect, test } from 'claude-code/testing'

import Dotnet from '../../fixtures/deps/dotnet'
import Fixtures from '../../fixtures'

describe('dotnet-detector', () => {
  const JACKETT = {
    'src/Jackett.Common/Jackett.Common.csproj': Dotnet.JACKETT_COMMON_CSPROJ,
    'src/Jackett.Test/Jackett.Test.csproj': Dotnet.JACKETT_TEST_CSPROJ,
  }

  const JELLYFIN = {
    'Directory.Packages.props': Dotnet.JELLYFIN_DIRECTORY_PACKAGES_PROPS,
    'Jellyfin.Server/Jellyfin.Server.csproj': Dotnet.JELLYFIN_SERVER_CSPROJ,
  }

  test('an inline version is the version in use', async () => {
    const { dependencies } = await Fixtures.scanOf(JACKETT)

    expect(Fixtures.depNamed(dependencies, 'Newtonsoft.Json')).toEqual({
      ecosystem: 'nuget',
      name: 'Newtonsoft.Json',
      versionInUse: '13.0.4',
      range: '13.0.4',
      isDev: false,
      isRoot: false,
      manifestPath: 'src/Jackett.Common/Jackett.Common.csproj',
    })
  })

  test('central package management: versions come from the nearest Directory.Packages.props', async () => {
    const { dependencies } = await Fixtures.scanOf(JELLYFIN)

    expect(Fixtures.depNamed(dependencies, 'CommandLineParser')).toMatchObject({
      versionInUse: '2.9.1',
      isDev: false,
    })
    expect(Fixtures.depNamed(dependencies, 'StyleCop.Analyzers')?.isDev).toBe(true)
  })

  test('without Directory.Packages.props a centrally managed reference has no version', async () => {
    const { dependencies } = await Fixtures.scanOf({
      'Jellyfin.Server/Jellyfin.Server.csproj': Dotnet.JELLYFIN_SERVER_CSPROJ,
    })

    expect(Fixtures.depNamed(dependencies, 'CommandLineParser')).toEqual({
      ecosystem: 'nuget',
      name: 'CommandLineParser',
      isDev: false,
      isRoot: false,
      manifestPath: 'Jellyfin.Server/Jellyfin.Server.csproj',
    })
  })

  test('a test project and PrivateAssets="all" references are dev: left out by default, followed with the toggle', async () => {
    const runtime = await Fixtures.detectedOf(JACKETT, { cap: 500 })
    const all = await Fixtures.detectedOf(JACKETT, { cap: 500, includeDev: true })
    const followed = runtime.project?.dependencies ?? []

    expect(Fixtures.depNamed(followed, 'FluentAssertions')).toBeUndefined()
    expect(Fixtures.depNamed(followed, 'Autofac')?.manifestPath).toBe(
      'src/Jackett.Common/Jackett.Common.csproj',
    )
    expect(Fixtures.depNamed(all.project?.dependencies ?? [], 'FluentAssertions')?.isDev).toBe(true)
  })

  test('a project file cut off mid-way is skipped with a debug line, never thrown', async () => {
    const { dependencies, logs } = await Fixtures.scanOf({
      ...JACKETT,
      'src/Jackett.Common/Jackett.Common.csproj': Dotnet.BROKEN_CSPROJ,
    })

    expect(dependencies.every(dependency => dependency.manifestPath.includes('Jackett.Test'))).toBe(
      true,
    )
    expect(logs).toContain(
      'news: deps: skipped src/Jackett.Common/Jackett.Common.csproj: not a complete <Project> document',
    )
  })
})
