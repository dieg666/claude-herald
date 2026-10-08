import { describe, expect, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'
import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('set-deps-enabled', () => {
  const settingsAt = (stored: ReadonlyMap<string, unknown>, root: string) =>
    Store.depsProjectOf(Store.depsProjectsOf(stored.get('deps'))[root]).settings

  const peeked = (text: string | undefined) =>
    JSON.parse(text ?? 'null') as { stack: { root: string; settings: { isEnabled: boolean } } }

  test(
    'off saves the setting for this project and mirrors it to state; on turns it back',
    { plugins: [Fixtures.STACK_PEEK] },
    async ($, on) => {
      const stored = Fixtures.storeOn(on, { sources: [] })

      Fixtures.fsOn(on, { '.git': { isDir: true } })

      expect((await $.command.run(Fixtures.heraldOf('deps off'))).text).toBe(
        'Stopped following the dependency releases of /repo; its stack items are hidden and nothing is fetched for them. Other sources are untouched.',
      )
      expect(settingsAt(stored, '/repo').isEnabled).toBe(false)
      expect(peeked((await $.command.run(Fixtures.PEEK_STACK)).text).stack).toMatchObject({
        root: '/repo',
        settings: { isEnabled: false },
      })

      expect((await $.command.run(Fixtures.heraldOf('deps on'))).text).toBe(
        'Following the dependency releases of /repo again; detecting its stack now.',
      )
      expect(settingsAt(stored, '/repo')).toEqual(Defaults.DEFAULT_DEPS_SETTINGS)
    },
  )

  test('anything after on or off, or the state already set, is refused and saves nothing', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [] })

    Fixtures.fsOn(on, { '.git': { isDir: true } })

    expect((await $.command.run(Fixtures.heraldOf('deps off now'))).text).toBe(
      '/herald deps off takes nothing after it.\nUsage: /herald deps off',
    )
    expect((await $.command.run(Fixtures.heraldOf('deps on'))).text).toBe(
      'Your stack is already on for /repo.',
    )
    expect(stored.has('deps')).toBe(false)
  })

  test('two projects keep separate settings', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [] })
    const root = Fixtures.rootsOn(on, ['/one', '/two'])

    await $.command.run(Fixtures.heraldOf('deps off'))
    root.current = '/two'
    await $.command.run(Fixtures.heraldOf('deps cap 3'))
    await $.command.run(Fixtures.heraldOf('deps level all'))
    root.current = '/one'
    await $.command.run(Fixtures.heraldOf('deps toast off'))

    expect(settingsAt(stored, '/one')).toEqual({
      ...Defaults.DEFAULT_DEPS_SETTINGS,
      isEnabled: false,
      toastLevel: 'off',
    })
    expect(settingsAt(stored, '/two')).toEqual({
      ...Defaults.DEFAULT_DEPS_SETTINGS,
      cap: 3,
      showLevel: 'all',
    })
  })
})
