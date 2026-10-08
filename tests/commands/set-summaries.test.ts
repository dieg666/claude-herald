import { describe, expect, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'
import Fixtures from '../fixtures'

describe('set-summaries', () => {
  const peeked = (text: string | undefined) => JSON.parse(text ?? 'null') as { settings: unknown }

  const OFF =
    'Automatic summaries are off: Herald asks Haiku for no summary on its own, and Summarize (s) still writes one when you press it.'

  const ON =
    'Automatic summaries are on: Haiku writes a one-line summary under the headlines the band and the pane show.'

  for (const [name, entries] of [
    ['a fresh store', {}],
    ['a store without the key', { settings: { lang: 'es', rotateSeconds: 30 } }],
  ] as const) {
    test(`with nothing after it, says off on ${name}, saving nothing`, async ($, on) => {
      const stored = Fixtures.storeOn(on, entries)

      expect((await $.command.run(Fixtures.heraldOf('summaries'))).text).toBe(
        `${OFF} /herald summaries on changes it.`,
      )
      expect(stored.get('settings')).toEqual('settings' in entries ? entries.settings : undefined)
    })
  }

  test(
    'on and off save the setting, keeping the others, mirror it to state and are read back bare',
    { plugins: [Fixtures.STATE_PEEK] },
    async ($, on) => {
      const stored = Fixtures.storeOn(on, { settings: { lang: 'es' } })

      expect((await $.command.run(Fixtures.heraldOf('summaries ON'))).text).toBe(ON)
      expect(stored.get('settings')).toEqual({
        ...Defaults.DEFAULT_SETTINGS,
        lang: 'es',
        autoSummaries: true,
      })
      expect(peeked((await $.command.run(Fixtures.PEEK)).text).settings).toMatchObject({
        autoSummaries: true,
      })
      expect((await $.command.run(Fixtures.heraldOf('summaries'))).text).toBe(
        `${ON} /herald summaries off changes it.`,
      )

      expect((await $.command.run(Fixtures.heraldOf('summaries off'))).text).toBe(OFF)
      expect(stored.get('settings')).toEqual({ ...Defaults.DEFAULT_SETTINGS, lang: 'es' })
      expect(peeked((await $.command.run(Fixtures.PEEK)).text).settings).toMatchObject({
        autoSummaries: false,
      })
    },
  )

  test('refuses anything but on or off, saving nothing', async ($, on) => {
    const stored = Fixtures.storeOn(on)

    for (const value of ['yes', '1', 'true', 'on off']) {
      expect((await $.command.run(Fixtures.heraldOf(`summaries ${value}`))).text).toBe(
        `Automatic summaries are on or off, e.g. /herald summaries on; "${value}" is neither.`,
      )
    }

    expect(stored.has('settings')).toBe(false)
  })

  test('/herald reset turns them off again', async ($, on) => {
    const stored = Fixtures.storeOn(on, { settings: Fixtures.SUMMARIES_ON })

    await $.command.run(Fixtures.heraldOf('reset'))

    expect(stored.get('settings')).toMatchObject({ autoSummaries: false })
  })
})
