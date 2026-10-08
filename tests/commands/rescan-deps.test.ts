import { describe, expect, test } from 'claude-code/testing'

import Fixtures from '../fixtures'

describe('rescan-deps', () => {
  test('answers at once, the detection left to run off the dispatch', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [] })
    const fs = Fixtures.fsOn(on, { '.git': { isDir: true }, 'package.json': '{}' })

    expect((await $.command.run(Fixtures.newsOf('deps rescan'))).text).toBe(
      'Detecting the stack of /repo again; /news deps shows it once done.',
    )
    expect(fs.reads).toEqual([])
    expect(stored.has('deps')).toBe(false)
  })

  test('refused with anything after it, or while the stack is off', async ($, on) => {
    Fixtures.storeOn(on, { sources: [], deps: { '/repo': { settings: { isEnabled: false } } } })
    Fixtures.fsOn(on, { '.git': { isDir: true } })

    expect((await $.command.run(Fixtures.newsOf('deps rescan all'))).text).toBe(
      '/news deps rescan takes nothing after it.\nUsage: /news deps rescan',
    )
    expect((await $.command.run(Fixtures.newsOf('deps rescan'))).text).toBe(
      'Your stack is off for /repo, so there is nothing to rescan; /news deps on turns it on and detects it.',
    )
  })
})
