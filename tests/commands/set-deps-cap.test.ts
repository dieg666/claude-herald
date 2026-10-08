import { describe, expect, test } from 'claude-code/testing'

import Fixtures from '../fixtures'

describe('set-deps-cap', () => {
  test('saves the cap, the bounds 1 and 500 included', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [] })

    Fixtures.fsOn(on, { '.git': { isDir: true } })

    expect((await $.command.run(Fixtures.heraldOf('deps cap 1'))).text).toBe(
      '/repo follows at most 1 dependency. Detecting its stack again.',
    )
    expect(stored.get('deps')).toMatchObject({ '/repo': { settings: { cap: 1 } } })
    expect((await $.command.run(Fixtures.heraldOf('deps cap 500'))).text).toBe(
      '/repo follows at most 500 dependencies. Detecting its stack again.',
    )
    expect(stored.get('deps')).toMatchObject({ '/repo': { settings: { cap: 500 } } })
  })

  test('anything but a whole number from 1 to 500 is refused with the usage line, saving nothing', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [] })

    Fixtures.fsOn(on, { '.git': { isDir: true } })

    for (const value of ['0', '501', 'abc', '-1', '2.5', '1e2', '10 20']) {
      expect((await $.command.run(Fixtures.heraldOf(`deps cap ${value}`))).text).toBe(
        `The cap is a whole number from 1 to 500; "${value}" is not one.\nUsage: /herald deps cap <1-500>`,
      )
    }

    expect(stored.has('deps')).toBe(false)
  })
})
