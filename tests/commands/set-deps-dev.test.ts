import { describe, expect, test } from 'claude-code/testing'

import Fixtures from '../fixtures'

describe('set-deps-dev', () => {
  test('on and off save the dev toggle for this project', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [] })

    Fixtures.fsOn(on, { '.git': { isDir: true } })

    expect((await $.command.run(Fixtures.newsOf('deps dev ON'))).text).toBe(
      'Dev dependencies are followed in /repo too. Detecting its stack again.',
    )
    expect(stored.get('deps')).toMatchObject({ '/repo': { settings: { includeDev: true } } })
    expect((await $.command.run(Fixtures.newsOf('deps dev on'))).text).toBe(
      'Dev dependencies are already followed in /repo.',
    )
    expect((await $.command.run(Fixtures.newsOf('deps dev off'))).text).toBe(
      'Only runtime dependencies are followed in /repo. Detecting its stack again.',
    )
    expect(stored.get('deps')).toMatchObject({ '/repo': { settings: { includeDev: false } } })
  })

  test('anything but on or off is refused with the usage line', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [] })

    Fixtures.fsOn(on, { '.git': { isDir: true } })

    expect((await $.command.run(Fixtures.newsOf('deps dev yes'))).text).toBe(
      'Dev dependencies are followed (on) or not (off); "yes" is neither.\nUsage: /news deps dev <on|off>',
    )
    expect(stored.has('deps')).toBe(false)
  })
})
