import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('add-dep', () => {
  const projectAt = (stored: ReadonlyMap<string, unknown>) =>
    Store.depsProjectOf(Store.depsProjectsOf(stored.get('deps'))['/repo'])

  const REPO = { '.git': { isDir: true as const } }

  test('follows ecosystem:name and a GitHub repository typed as owner/repo or its URL', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [] })

    Fixtures.fsOn(on, REPO)

    expect((await $.command.run(Fixtures.heraldOf('deps add npm:zod'))).text).toBe(
      'Following npm:zod in /repo. Looking it up now.',
    )
    expect((await $.command.run(Fixtures.heraldOf('deps add owner/tool'))).text).toBe(
      'Following github:owner/tool in /repo. Looking it up now.',
    )
    await $.command.run(Fixtures.heraldOf('deps add https://github.com/acme/kit/tree/main'))

    const GITHUB = { ecosystem: 'github', isDev: false, isRoot: true, manifestPath: '' }
    const added = [
      { ecosystem: 'npm', name: 'zod', isDev: false, isRoot: true, manifestPath: '' },
      { ...GITHUB, name: 'owner/tool', source: 'https://github.com/owner/tool' },
      { ...GITHUB, name: 'acme/kit', source: 'https://github.com/acme/kit' },
    ]

    expect(projectAt(stored).added).toEqual(added)
    expect(projectAt(stored).dependencies).toEqual(added)
  })

  test('something followed already, or neither a package nor a repository, is refused with the usage line', async ($, on) => {
    const stored = Fixtures.storeOn(on, {
      sources: [],
      deps: {
        '/repo': {
          dependencies: [
            Fixtures.depAt('zod'),
            Fixtures.depAt('Alamofire', {
              ecosystem: 'swift',
              manifestPath: 'Package.swift',
              source: 'https://github.com/Alamofire/Alamofire.git',
            }),
          ],
        },
      },
    })

    Fixtures.fsOn(on, REPO)

    const before = JSON.stringify(stored.get('deps'))
    const usage = '\nUsage: /herald deps add <ecosystem:package|owner/repo>'

    expect((await $.command.run(Fixtures.heraldOf('deps add npm:zod'))).text).toBe(
      `npm:zod is followed already in /repo.${usage}`,
    )
    expect((await $.command.run(Fixtures.heraldOf('deps add alamofire/alamofire'))).text).toBe(
      `swift:Alamofire is followed already in /repo.${usage}`,
    )
    expect((await $.command.run(Fixtures.heraldOf('deps add zod'))).text).toBe(
      `"zod" is neither <ecosystem>:<package> (e.g. npm:zod) nor a GitHub repository (owner/repo or its URL).${usage}`,
    )
    expect((await $.command.run(Fixtures.heraldOf('deps add nuget:'))).text).toContain(usage)
    expect((await $.command.run(Fixtures.heraldOf('deps add npm:zod extra words'))).text).toBe(
      `"npm:zod extra words" is neither <ecosystem>:<package> (e.g. npm:zod) nor a GitHub repository (owner/repo or its URL).${usage}`,
    )
    expect((await $.command.run(Fixtures.heraldOf('deps add "npm:left pad"'))).text).toContain(
      usage,
    )
    expect(JSON.stringify(stored.get('deps'))).toBe(before)
  })

  test('adding an ignored package takes it off the ignored list', async ($, on) => {
    const stored = Fixtures.storeOn(on, {
      sources: [],
      deps: { '/repo': { ignored: ['npm:zod', 'npm:left-pad'] } },
    })

    Fixtures.fsOn(on, REPO)

    expect((await $.command.run(Fixtures.heraldOf('deps add npm:zod'))).text).toBe(
      'npm:zod is no longer ignored and is followed in /repo. Looking it up now.',
    )
    expect(projectAt(stored).ignored).toEqual(['npm:left-pad'])
    expect(projectAt(stored).added?.map(dependency => dependency.name)).toEqual(['zod'])
  })

  test('with the stack off the package is recorded and the reply says how to turn it on', async ($, on) => {
    Fixtures.storeOn(on, { sources: [], deps: { '/repo': { settings: { isEnabled: false } } } })
    Fixtures.fsOn(on, REPO)

    expect((await $.command.run(Fixtures.heraldOf('deps add cargo:serde'))).text).toBe(
      'Following cargo:serde in /repo. Your stack is off for this project; /herald deps on turns it on.',
    )
  })
})
