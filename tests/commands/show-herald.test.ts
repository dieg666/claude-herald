import type { RenderSurface, UiOpenResult } from 'claude-code'
import { describe, expect, mock, test } from 'claude-code/testing'

import Fixtures from '../fixtures'

describe('show-herald', () => {
  const FEED = Fixtures.sourceAt('feed', { name: 'Feed' })
  const QUIET = Fixtures.sourceAt('quiet', { name: 'Quiet' })
  const OFF = Fixtures.sourceAt('off', { name: 'Off', isEnabled: false })

  const STORE = {
    sources: [FEED, QUIET, OFF],
    items: {
      feed: ['a', 'b', 'c', 'd'].map(key => ({ ...Fixtures.itemAt(key), sourceId: 'feed' })),
      off: [Fixtures.itemAt('hidden')],
    },
  }

  const DIGEST = [
    'Feed',
    '  a · https://example.com/a',
    '  b · https://example.com/b',
    '  c · https://example.com/c',
    '',
    'Quiet',
    '  nothing yet',
  ].join('\n')

  for (const surface of ['terminal', 'desktop'] as const) {
    test(`opens the pane, focused and closed by Escape, on the ${surface}`, async ($, on) => {
      Fixtures.storeOn(on, STORE)

      const opened = Fixtures.paneOn(on, [surface])

      expect((await $.command.run(Fixtures.heraldOf(''))).text).toBe('Opened the Herald pane.')
      expect(opened).toEqual([{ id: 'herald', title: 'Herald', focus: true, closeOnEscape: true }])
    })
  }

  test('opening the pane records the tab it shows as viewed; a pane waiting for room does not', async ($, on) => {
    const placed = Fixtures.storeOn(on, STORE)
    let result: UiOpenResult = { isPlaced: false, reason: 'the terminal is 80 columns wide' }

    on('session.surfaces', () => ({ value: ['terminal'] }))
    on('ui.open', () => ({ value: result }))
    on('ui.log', () => ({ value: undefined }))
    on('classic.SessionStart', () => ({}))

    await $.classic.SessionStart({ source: 'clear' })
    await $.command.run(Fixtures.heraldOf(''))

    expect(placed.get('viewed')).toBeUndefined()

    result = { isPlaced: true }
    await $.command.run(Fixtures.heraldOf(''))

    expect(placed.get('viewed')).toEqual({ feed: ['src:a', 'src:b', 'src:c', 'src:d'] })
  })

  test(
    'opening the pane summarizes the items its first tab shows; the digest asks for none',
    { timeoutMs: 20_000 },
    async ($, on) => {
      const clock = mock.clock(on)
      const { asked } = Fixtures.bandOn(on, STORE)
      const surfaces: RenderSurface[] = []

      on('session.surfaces', () => ({ value: [...surfaces] }))
      on('ui.open', () => ({ value: { isPlaced: true } }))

      await $.classic.SessionStart({ source: 'clear' })
      await $.command.run(Fixtures.heraldOf(''))
      await clock.settle()

      expect(asked).toEqual([])

      surfaces.push('terminal')
      await $.command.run(Fixtures.heraldOf(''))
      await clock.settle()

      expect([...asked].sort()).toEqual(['a', 'b', 'c', 'd'])
    },
  )

  test('with no surface attached, answers the latest items of every enabled source', async ($, on) => {
    Fixtures.storeOn(on, STORE)

    const opened = Fixtures.paneOn(on, [])

    expect((await $.command.run(Fixtures.heraldOf(''))).text).toBe(DIGEST)
    expect(opened).toEqual([])
  })

  test('on surfaces that draw no pane, answers the digest too', async ($, on) => {
    Fixtures.storeOn(on, STORE)

    const opened = Fixtures.paneOn(on, ['vscode', 'mobile'])

    expect((await $.command.run(Fixtures.heraldOf('   '))).text).toBe(DIGEST)
    expect(opened).toEqual([])
  })

  test('a pane that waits for room says why', async ($, on) => {
    Fixtures.storeOn(on, STORE)
    Fixtures.paneOn(on, ['terminal'], { isPlaced: false, reason: 'needs 144 columns' })

    expect((await $.command.run(Fixtures.heraldOf(''))).text).toBe(
      'The Herald pane is open and shows once there is room: needs 144 columns',
    )
  })

  test('a refused pane falls back to the digest, logged to debug', async ($, on) => {
    Fixtures.storeOn(on, STORE)

    const logs = Fixtures.logsOn(on)

    on('session.surfaces', () => ({ value: ['terminal'] }))
    on('ui.open', () => ({ deny: 'no panes here' }))

    expect((await $.command.run(Fixtures.heraldOf(''))).text).toBe(DIGEST)
    expect(logs).toEqual([expect.stringMatching(/^debug: herald: could not open the pane: /)])
  })

  test('with every source off, says how to turn one on', async ($, on) => {
    Fixtures.storeOn(on, { sources: [OFF] })
    Fixtures.paneOn(on, [])

    expect((await $.command.run(Fixtures.heraldOf(''))).text).toBe(
      'Every source is off. /herald list shows them; /herald enable <name> turns one on.',
    )
  })
})
