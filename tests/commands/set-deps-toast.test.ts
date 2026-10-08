import { describe, expect, test } from 'claude-code/testing'

import Fixtures from '../fixtures'

describe('set-deps-toast', () => {
  test('saves the toast level, off included', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [] })

    Fixtures.fsOn(on, { '.git': { isDir: true } })

    expect((await $.command.run(Fixtures.heraldOf('deps toast all'))).text).toBe(
      'New all dependency releases of /repo raise a toast.',
    )
    expect((await $.command.run(Fixtures.heraldOf('deps toast OFF'))).text).toBe(
      'No toast for new dependency releases of /repo.',
    )
    expect(stored.get('deps')).toMatchObject({ '/repo': { settings: { toastLevel: 'off' } } })
  })

  test('an unknown level is refused with the usage line', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [] })

    Fixtures.fsOn(on, { '.git': { isDir: true } })

    expect((await $.command.run(Fixtures.heraldOf('deps toast loud'))).text).toBe(
      'The toast level is all, minor+, major+breaking+security, breaking+security, off; "loud" is none of them.\nUsage: /herald deps toast <level|off>',
    )
    expect(stored.has('deps')).toBe(false)
  })
})
