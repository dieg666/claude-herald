import { describe, expect, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'
import Fixtures from '../fixtures'

describe('set-rotate', () => {
  const peeked = (text: string | undefined) => JSON.parse(text ?? 'null') as { settings: unknown }

  test(
    'saves the seconds, keeping the other settings, and mirrors them to state',
    { plugins: [Fixtures.STATE_PEEK] },
    async ($, on) => {
      const stored = Fixtures.storeOn(on, { settings: { refreshMinutes: 9 } })
      const expected = { ...Defaults.DEFAULT_SETTINGS, refreshMinutes: 9, rotateSeconds: 45 }

      expect((await $.command.run(Fixtures.heraldOf('rotate 45'))).text).toBe(
        'The band turns its page every 45 seconds.',
      )
      expect(stored.get('settings')).toEqual(expected)
      expect(peeked((await $.command.run(Fixtures.PEEK)).text).settings).toEqual(expected)
    },
  )

  test('accepts the bounds, 5 and 3600', async ($, on) => {
    const stored = Fixtures.storeOn(on)

    await $.command.run(Fixtures.heraldOf('rotate 5'))

    expect(stored.get('settings')).toMatchObject({ rotateSeconds: 5 })

    await $.command.run(Fixtures.heraldOf('rotate 3600'))

    expect(stored.get('settings')).toMatchObject({ rotateSeconds: 3600 })
  })

  test('refuses anything but whole seconds from 5 to 3600, saving nothing', async ($, on) => {
    const stored = Fixtures.storeOn(on)

    for (const value of ['4', '3601', '0', '-5', '7.5', 'ten', '1e3', '20 30']) {
      expect((await $.command.run(Fixtures.heraldOf(`rotate ${value}`))).text).toBe(
        `The rotation is whole seconds from 5 to 3600, e.g. /herald rotate 30; "${value}" is not one.`,
      )
    }

    expect(stored.has('settings')).toBe(false)
  })
})
