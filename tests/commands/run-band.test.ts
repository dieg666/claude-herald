import { describe, expect, test } from 'claude-code/testing'

import Fixtures from '../fixtures'

describe('run-band', () => {
  const FEED = Fixtures.sourceAt('feed', { name: 'My Feed' })

  test('size sets the band size, on and off show or hide a source, whatever their case', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [FEED] })

    expect((await $.command.run(Fixtures.heraldOf('band Size 4'))).text).toMatch(
      /^The band shows 4 items at once/,
    )
    expect(stored.get('settings')).toMatchObject({ bandSize: 4 })
    expect((await $.command.run(Fixtures.heraldOf('band OFF My Feed'))).text).toMatch(
      /^"My Feed" is now hidden from the band/,
    )
    expect(stored.get('sources')).toEqual([{ ...FEED, isOnBand: false }])
  })

  test('another word answers both forms and changes nothing', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [FEED] })

    for (const args of ['band sizes 4', 'band 5', 'band hide My Feed']) {
      const word = args.split(' ')[1]

      expect((await $.command.run(Fixtures.heraldOf(args))).text).toBe(
        `/herald band on|off <name> shows or hides a source in the band, the rotating lines above the prompt; /herald band size <n> sets how many items it shows at once, 1 to 9; "${word}" is neither on, off nor size.`,
      )
    }

    expect([...stored.keys()]).toEqual(['sources'])
    expect(stored.get('sources')).toEqual([FEED])
  })
})
