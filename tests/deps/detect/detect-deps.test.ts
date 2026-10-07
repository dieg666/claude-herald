import { describe, expect, test } from 'claude-code/testing'

import Defaults from '../../../hooks/defaults'
import Detect from '../../../hooks/deps/detect'
import Fixtures from '../../fixtures'
import Go from '../../fixtures/deps/go'
import Npm from '../../fixtures/deps/npm'

describe('detect-deps', () => {
  test('stores the followed dependencies, the count and every file hash under the root', async () => {
    const { project, stored } = await Fixtures.detectedOf(
      {
        'package.json': Npm.REACT_PACKAGE_JSON,
        'yarn.lock': Npm.REACT_YARN_LOCK,
      },
      { includeDev: true },
    )

    expect(project?.dependencies.length).toBe(5)
    expect(project?.detectedCount).toBe(5)
    expect(Object.keys(project?.manifestHashes ?? {})).toEqual(['package.json', 'yarn.lock'])
    expect(project?.manifestHashes['yarn.lock']).toBe(Detect.manifestHashOf(Npm.REACT_YARN_LOCK))
    expect(stored.get('deps')).toEqual({ '/repo': project })
  })

  test('the cap from the project settings bounds what is followed', async () => {
    const { project } = await Fixtures.detectedOf({ 'go.mod': Go.K8S_GO_MOD }, { cap: 2 })

    expect(project?.dependencies.map(dependency => dependency.name)).toEqual([
      'bitbucket.org/bertimus9/systemstat',
      'github.com/google/go-cmp',
    ])
    expect(project?.detectedCount).toBe(6)
  })

  test('each project keeps its own record and settings: two roots never mix', async () => {
    const fake = Fixtures.fakeHostOf({
      deps: { '/a': { settings: { cap: 1 } }, '/b': { settings: { includeDev: true } } },
    })

    Object.assign(fake.host, Fixtures.fakeFsOf('/a', { 'go.mod': Go.K8S_GO_MOD }))
    await Detect.detectDeps(fake.host, '/a')
    Object.assign(fake.host, Fixtures.fakeFsOf('/b', { 'package.json': Npm.REACT_PACKAGE_JSON }))
    await Detect.detectDeps(fake.host, '/b')

    const a = await Fixtures.loadDeps(fake.host, '/a')
    const b = await Fixtures.loadDeps(fake.host, '/b')

    expect(a.settings).toEqual({ ...Defaults.DEFAULT_DEPS_SETTINGS, cap: 1 })
    expect(a.dependencies.map(dependency => dependency.ecosystem)).toEqual(['go'])
    expect(b.settings).toEqual({ ...Defaults.DEFAULT_DEPS_SETTINGS, includeDev: true })
    expect(b.dependencies.every(dependency => dependency.ecosystem === 'npm')).toBe(true)
    expect(b.dependencies.length).toBe(5)
  })

  test('a project with its stack turned off is not walked', async () => {
    const { project, lists } = await Fixtures.detectedOf(
      { 'go.mod': Go.K8S_GO_MOD },
      { isEnabled: false },
    )

    expect(project?.dependencies).toEqual([])
    expect(lists).toEqual(['/repo'])
  })

  test('the session root inside a repository detects from the repository root', async () => {
    const fake = Fixtures.fakeHostOf()

    Object.assign(
      fake.host,
      Fixtures.fakeFsOf(
        '/repo',
        { '.git': { isDir: true }, 'go.mod': Go.K8S_GO_MOD, 'cmd/app/main.go': '' },
        '/repo/cmd/app',
      ),
    )

    const project = await Detect.detectDeps(fake.host)

    expect(Object.keys(fake.stored.get('deps') as object)).toEqual(['/repo'])
    expect(project?.dependencies[0]?.manifestPath).toBe('go.mod')
  })

  test('a failure is one debug line and no throw', async () => {
    const fake = Fixtures.fakeHostOf()

    fake.host.sessionRoot = async () => {
      throw new Error('no session')
    }

    expect(await Detect.detectDeps(fake.host)).toBeUndefined()
    expect(fake.logs).toEqual(['news: deps: detection failed: no session'])
  })
})
