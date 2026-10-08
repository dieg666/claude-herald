import { describe, expect, test } from 'claude-code/testing'

import Fixtures from '../fixtures'

describe('set-deps-level', () => {
  test(
    'saves the show level, any case and spacing, and mirrors it to state',
    { plugins: [Fixtures.STACK_PEEK] },
    async ($, on) => {
      const stored = Fixtures.storeOn(on, { sources: [] })

      Fixtures.fsOn(on, { '.git': { isDir: true } })

      expect((await $.command.run(Fixtures.heraldOf('deps level Minor+'))).text).toBe(
        'The band and the pane show the minor+ dependency releases of /repo.',
      )
      await $.command.run(Fixtures.heraldOf('deps level major + Breaking + security'))

      expect(stored.get('deps')).toMatchObject({
        '/repo': { settings: { showLevel: 'major+breaking+security' } },
      })
      expect(JSON.parse((await $.command.run(Fixtures.PEEK_STACK)).text ?? 'null')).toMatchObject({
        stack: { settings: { showLevel: 'major+breaking+security' } },
      })
    },
  )

  test('an unknown level, off included, is refused with the usage line', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [] })

    Fixtures.fsOn(on, { '.git': { isDir: true } })

    for (const value of ['patch', 'off', 'minor']) {
      expect((await $.command.run(Fixtures.heraldOf(`deps level ${value}`))).text).toBe(
        `The level is all, minor+, major+breaking+security, breaking+security; "${value}" is none of them.\nUsage: /herald deps level <level>`,
      )
    }

    expect(stored.has('deps')).toBe(false)
  })
})
