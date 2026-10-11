import type { ElementQuery, FoundElement } from 'claude-code/testing'
import { describe, expect, mock, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'
import Fixtures from '../fixtures'

describe('set-band-size', () => {
  const SOURCE = Fixtures.sourceAt('src')
  const BAND = { plugin: 'herald', component: 'AbovePrompt', props: Fixtures.BAND_PROPS } as const
  const USAGE =
    '/herald band size <n> sets how many items the band shows at once, 1 to 9 (default 3)'

  type Drawing = {
    find: (query: ElementQuery) => Promise<FoundElement | undefined>
    findAll: (query: ElementQuery) => Promise<FoundElement[]>
  }

  const peeked = (text: string | undefined) => JSON.parse(text ?? 'null') as { settings: unknown }

  const rangeOf = async (ui: Drawing) => (await ui.find({ type: 'Text', text: / of \d+$/ }))?.text

  // The headline of the selected row: the bold Text holding its Link.
  const selectedOf = async (ui: Drawing) => {
    const [bold] = (await ui.findAll({ type: 'Text' })).filter(
      text => text.props.bold === true && text.text !== 'Herald',
    )
    const [child] = bold?.children ?? []

    return (child as FoundElement | undefined)?.props.href
  }

  test(
    'saves the size, keeping the other settings, and mirrors them to state',
    { plugins: [Fixtures.STATE_PEEK] },
    async ($, on) => {
      const stored = Fixtures.storeOn(on, { settings: { rotateSeconds: 45 } })
      const expected = { ...Defaults.DEFAULT_SETTINGS, rotateSeconds: 45, bandSize: 5 }

      expect((await $.command.run(Fixtures.heraldOf('band size 5'))).text).toBe(
        'The band shows 5 items at once, or one where the terminal is too narrow for the full band.',
      )
      expect(stored.get('settings')).toEqual(expected)
      expect(peeked((await $.command.run(Fixtures.PEEK)).text).settings).toEqual(expected)
    },
  )

  test('accepts the bounds, 1 and 9', async ($, on) => {
    const stored = Fixtures.storeOn(on)

    expect((await $.command.run(Fixtures.heraldOf('band size 1'))).text).toBe(
      'The band shows 1 item at once, or one where the terminal is too narrow for the full band.',
    )
    expect(stored.get('settings')).toMatchObject({ bandSize: 1 })

    await $.command.run(Fixtures.heraldOf('band SIZE 9'))

    expect(stored.get('settings')).toMatchObject({ bandSize: 9 })
  })

  test('refuses anything but a whole number from 1 to 9, or no number, answering the usage and saving nothing', async ($, on) => {
    const stored = Fixtures.storeOn(on)

    for (const value of ['0', '10', 'x', 'five', '-1', '2.5', '1e1', '3 4']) {
      expect((await $.command.run(Fixtures.heraldOf(`band size ${value}`))).text).toBe(
        `${USAGE}; "${value}" is not a whole number from 1 to 9.`,
      )
    }

    expect((await $.command.run(Fixtures.heraldOf('band size'))).text).toBe(
      `${USAGE}; the number is missing.`,
    )
    expect(stored.has('settings')).toBe(false)
  })

  for (const surface of ['terminal', 'desktop'] as const) {
    test(
      `on ${surface}: paused on the last item, a larger page keeps it selected on the last page, and back`,
      { timeoutMs: 30_000 },
      async ($, on) => {
        mock.clock(on)
        Fixtures.bandOn(on, { sources: [SOURCE], items: { src: Fixtures.datedItemsOf('src', 7) } })

        await $.classic.SessionStart({ source: 'clear' })

        const ui = await $.ui.mount({ ...BAND, surface })

        await ui.press({ key: 'prev' })

        expect([await rangeOf(ui), await selectedOf(ui)]).toEqual([
          '7 of 7',
          'https://example.com/src/7',
        ])

        await $.command.run(Fixtures.heraldOf('band size 5'))

        expect([await rangeOf(ui), await selectedOf(ui)]).toEqual([
          '6–7 of 7',
          'https://example.com/src/7',
        ])
        expect((await ui.findAll({ type: 'Link' })).length).toBe(2)

        await ui.press({ key: 'up' })
        await $.command.run(Fixtures.heraldOf('band size 3'))

        expect([await rangeOf(ui), await selectedOf(ui)]).toEqual([
          '4–6 of 7',
          'https://example.com/src/6',
        ])
        expect((await ui.find({ key: 'auto' }))?.props.label).toBe('↻ auto')
      },
    )
  }

  test(
    'with automatic summaries on, the page of the new size is summarized at once, no item past it',
    { timeoutMs: 30_000 },
    async ($, on) => {
      const clock = mock.clock(on)
      const { asked } = Fixtures.bandOn(on, {
        sources: [SOURCE],
        items: { src: Fixtures.datedItemsOf('src', 12) },
        settings: Fixtures.SUMMARIES_ON,
      })

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })

      await $.command.run(Fixtures.heraldOf('band size 5'))
      await clock.settle()

      expect([...asked].sort()).toEqual(['src 1', 'src 2', 'src 3', 'src 4', 'src 5'])

      await ui.press({ key: 'next' })
      await clock.settle()

      expect(asked.slice(5).sort()).toEqual(['src 10', 'src 6', 'src 7', 'src 8', 'src 9'])
    },
  )
})
