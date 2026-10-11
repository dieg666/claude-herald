import { describe, expect, test } from 'claude-code/testing'

import Fixtures from '../fixtures'

describe('set-surface', () => {
  const FEED = Fixtures.sourceAt('feed', { name: 'My Feed' })

  const peeked = (text: string | undefined) =>
    JSON.parse(text ?? 'null') as { sources: Record<string, unknown>[] }

  test(
    'band off hides the source from the band in the store and in state, still in the pane',
    { plugins: [Fixtures.STATE_PEEK] },
    async ($, on) => {
      const stored = Fixtures.storeOn(on, { sources: [FEED] })

      expect((await $.command.run(Fixtures.heraldOf('band off my feed'))).text).toBe(
        '"My Feed" is now hidden from the band, the rotating lines above the prompt. It shows only in the pane.',
      )
      expect(stored.get('sources')).toEqual([{ ...FEED, isOnBand: false }])
      expect(peeked((await $.command.run(Fixtures.PEEK)).text).sources).toEqual([
        { ...FEED, isOnBand: false },
      ])
    },
  )

  test('pane off hides it from the pane; hidden from both, it says it is still fetched', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [{ ...FEED, isOnBand: false }] })

    expect((await $.command.run(Fixtures.heraldOf('pane off "My Feed"'))).text).toBe(
      '"My Feed" is now hidden from the pane, the /herald window. It shows nowhere now but is still fetched; /herald disable My Feed stops that.',
    )
    expect(stored.get('sources')).toEqual([{ ...FEED, isOnBand: false, isInPane: false }])
  })

  test('on shows it again, the flag left out as for a source stored before the flags', async ($, on) => {
    const stored = Fixtures.storeOn(on, {
      sources: [{ ...FEED, isOnBand: false, isInPane: false }],
    })

    expect((await $.command.run(Fixtures.heraldOf('PANE ON My Feed'))).text).toBe(
      '"My Feed" is now shown in the pane, the /herald window. It shows only in the pane.',
    )
    expect(stored.get('sources')).toEqual([{ ...FEED, isOnBand: false }])
    expect((await $.command.run(Fixtures.heraldOf('band on My Feed'))).text).toBe(
      '"My Feed" is now shown in the band, the rotating lines above the prompt. It shows in both the band and the pane.',
    )
    expect(stored.get('sources')).toEqual([FEED])
  })

  test('a source already on or off there is left alone', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [{ ...FEED, isInPane: false }] })

    expect((await $.command.run(Fixtures.heraldOf('band on My Feed'))).text).toBe(
      '"My Feed" is already shown in the band, the rotating lines above the prompt.',
    )
    expect((await $.command.run(Fixtures.heraldOf('pane off My Feed'))).text).toBe(
      '"My Feed" is already hidden from the pane, the /herald window.',
    )
    expect(stored.get('sources')).toEqual([{ ...FEED, isInPane: false }])
  })

  test('a disabled source takes the flag and says it shows nowhere until enabled', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [{ ...FEED, isEnabled: false }] })

    expect((await $.command.run(Fixtures.heraldOf('band off My Feed'))).text).toBe(
      '"My Feed" is now hidden from the band, the rotating lines above the prompt. It is disabled, so it shows nowhere until /herald enable My Feed.',
    )
    expect(stored.get('sources')).toEqual([{ ...FEED, isEnabled: false, isOnBand: false }])
  })

  test('an unknown name, a word other than on or off, or a missing name is refused, saving nothing', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [FEED] })

    expect((await $.command.run(Fixtures.heraldOf('band off Other'))).text).toBe(
      'No source is named "Other". /herald list shows them.',
    )
    expect((await $.command.run(Fixtures.heraldOf('pane hide My Feed'))).text).toBe(
      '/herald pane on|off <name> shows or hides a source in the pane, the /herald window; "hide" is neither on nor off.',
    )
    expect((await $.command.run(Fixtures.heraldOf('band off'))).text).toBe(
      "/herald band on|off <name> shows or hides a source in the band, the rotating lines above the prompt; the source's name is missing.",
    )
    expect((await $.command.run(Fixtures.heraldOf('band My Feed'))).text).toBe(
      '/herald band on|off <name> shows or hides a source in the band, the rotating lines above the prompt; "My" is neither on nor off.',
    )
    expect(stored.get('sources')).toEqual([FEED])
  })
})
