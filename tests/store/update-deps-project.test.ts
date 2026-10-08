import { describe, expect, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'
import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('update-deps-project', () => {
  test('changes one project as read right before writing, keeping the others, and answers it cleaned', async () => {
    const { host, stored } = Fixtures.fakeHostOf({
      deps: {
        '/repo': { settings: { cap: 7 }, dependencies: [Fixtures.depAt('react')], detectedAt: 3 },
        '/other': { settings: { isEnabled: false }, detectedAt: 9 },
      },
    })

    const project = await Store.updateDepsProject(host, '/repo', before => ({
      ...before,
      settings: { ...before.settings, cap: 9000, showLevel: 'all' },
      ignored: ['npm:lodash', 'npm:lodash', 'nope'],
      added: [],
    }))

    expect(project).toEqual({
      settings: { ...Defaults.DEFAULT_DEPS_SETTINGS, cap: 500, showLevel: 'all' },
      dependencies: [Fixtures.depAt('react')],
      detectedCount: 0,
      manifestHashes: {},
      detectedAt: 3,
      ignored: ['npm:lodash'],
    })
    expect(Store.depsProjectsOf(stored.get('deps'))).toEqual({
      '/other': { settings: { isEnabled: false }, detectedAt: 9 },
      '/repo': project,
    })
  })

  test('a project never stored starts from the defaults; past the most kept, the least recently detected other goes', async () => {
    const others = Object.fromEntries(
      Array.from({ length: Store.DEPS_PROJECTS_MAX }, (_, i) => [`/p${i}`, { detectedAt: i + 1 }]),
    )
    const { host, stored } = Fixtures.fakeHostOf({ deps: others })

    await Store.updateDepsProject(host, '/new', before => ({
      ...before,
      settings: { ...before.settings, isEnabled: false },
    }))

    const kept = Object.keys(Store.depsProjectsOf(stored.get('deps')))

    expect(kept.length).toBe(Store.DEPS_PROJECTS_MAX)
    expect(kept).toContain('/new')
    expect(kept).not.toContain('/p0')
  })
})
