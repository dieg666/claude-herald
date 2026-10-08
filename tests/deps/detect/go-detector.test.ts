import { describe, expect, test } from 'claude-code/testing'

import Fixtures from '../../fixtures'
import Go from '../../fixtures/deps/go'

describe('go-detector', () => {
  const KUBERNETES = {
    'go.work': Go.K8S_GO_WORK,
    'go.mod': Go.K8S_GO_MOD,
    'staging/src/k8s.io/client-go/go.mod': Go.K8S_CLIENT_GO_GO_MOD,
  }

  test('direct requirements are in use at their go.mod version', async () => {
    const { dependencies } = await Fixtures.scanOf(KUBERNETES)

    expect(Fixtures.depNamed(dependencies, 'github.com/spf13/cobra')).toEqual({
      ecosystem: 'go',
      name: 'github.com/spf13/cobra',
      versionInUse: 'v1.10.2',
      range: 'v1.10.2',
      isDev: false,
      isRoot: true,
      manifestPath: 'go.mod',
    })
  })

  test('a +incompatible version is in use without the suffix; the range keeps it', async () => {
    const { dependencies } = await Fixtures.scanOf({
      'go.mod': 'module example.com/app\n\nrequire github.com/docker/docker v27.1.1+incompatible\n',
    })

    expect(Fixtures.depNamed(dependencies, 'github.com/docker/docker')).toMatchObject({
      versionInUse: 'v27.1.1',
      range: 'v27.1.1+incompatible',
    })
  })

  test('indirect requirements and modules replaced by a local directory are left out', async () => {
    const { dependencies } = await Fixtures.scanOf(KUBERNETES)

    expect(Fixtures.depNamed(dependencies, 'cel.dev/expr')).toBeUndefined()
    expect(Fixtures.depNamed(dependencies, 'k8s.io/api')).toBeUndefined()
    expect(Fixtures.depNamed(dependencies, 'k8s.io/client-go')).toBeUndefined()
  })

  test('go.work members are found below the walk depth, through use directives', async () => {
    const { dependencies, lists } = await Fixtures.scanOf(KUBERNETES, { maxDepth: 1, maxDirs: 50 })

    expect(
      Fixtures.depNamed(dependencies, 'golang.org/x/oauth2', 'staging/src/k8s.io/client-go/go.mod'),
    ).toMatchObject({ versionInUse: 'v0.37.0', isRoot: false })
    expect(lists).toContain('/repo/staging/src/k8s.io/client-go')
  })

  test('Go has no dev dependencies: the toggle changes nothing; a module both declare counts once', async () => {
    const runtime = await Fixtures.detectedOf(KUBERNETES, { cap: 500 })
    const all = await Fixtures.detectedOf(KUBERNETES, { cap: 500, includeDev: true })
    const cmp = runtime.project?.dependencies.filter(
      dependency => dependency.name === 'github.com/google/go-cmp',
    )

    expect(runtime.project?.dependencies).toEqual(all.project?.dependencies ?? [])
    expect(runtime.project?.detectedCount).toBe(8)
    expect(cmp?.map(dependency => dependency.manifestPath)).toEqual(['go.mod'])
  })

  test('a go.mod cut off inside a block is skipped with a debug line, never thrown', async () => {
    const { dependencies, logs } = await Fixtures.scanOf({
      'go.mod': Go.K8S_GO_MOD,
      'tools/go.mod': Go.BROKEN_GO_MOD,
    })

    expect(dependencies.every(dependency => dependency.manifestPath === 'go.mod')).toBe(true)
    expect(logs).toContain('herald: deps: skipped tools/go.mod: unterminated require block')
  })
})
