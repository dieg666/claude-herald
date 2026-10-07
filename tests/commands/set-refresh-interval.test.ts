import { describe, expect, mock, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'
import Fixtures from '../fixtures'

describe('set-refresh-interval', () => {
  const peeked = (text: string | undefined) => JSON.parse(text ?? 'null') as { settings: unknown }

  test(
    'saves the minutes, keeping the other settings, and mirrors them to state',
    { plugins: [Fixtures.STATE_PEEK] },
    async ($, on) => {
      mock.clock(on)

      const stored = Fixtures.storeOn(on, { sources: [], settings: { lang: 'es' } })
      const expected = { ...Defaults.DEFAULT_SETTINGS, lang: 'es', refreshMinutes: 1440 }

      expect((await $.command.run(Fixtures.newsOf('interval 1440'))).text).toBe(
        'Refreshing every 1440 minutes, starting now.',
      )
      expect(stored.get('settings')).toEqual(expected)
      expect(peeked((await $.command.run(Fixtures.PEEK)).text).settings).toEqual(expected)
      expect((await $.command.run(Fixtures.newsOf('interval 1'))).text).toBe(
        'Refreshing every 1 minute, starting now.',
      )
    },
  )

  test('refuses anything but whole minutes from 1 to 1440, saving nothing', async ($, on) => {
    const stored = Fixtures.storeOn(on)

    for (const value of ['0', '1441', '1.5', 'five', '-1', '0x10']) {
      expect((await $.command.run(Fixtures.newsOf(`interval ${value}`))).text).toBe(
        `The interval is whole minutes from 1 to 1440, e.g. /news interval 10; "${value}" is not one.`,
      )
    }

    expect(stored.has('settings')).toBe(false)
  })
})
