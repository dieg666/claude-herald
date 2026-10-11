import { describe, expect, mock, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'
import Fixtures from '../fixtures'

describe('reset-herald', () => {
  const ADDED = Fixtures.sourceAt('added')
  const SAVED = { ...Fixtures.itemAt('s'), savedAt: 3 }
  const HN = { ...Defaults.FACTORY_SOURCES[6], isEnabled: false, isOnBand: false, isInPane: false }
  const HN_ITEM = { ...Fixtures.itemAt('h'), id: 'hacker-news:h', sourceId: 'hacker-news' }

  const peeked = (text: string | undefined) =>
    JSON.parse(text ?? 'null') as { sources: unknown; settings: unknown; saved: unknown }

  test(
    'restores the factory sources (shown on the band and in the pane) and default settings, drops added sources, keeps saved items',
    { plugins: [Fixtures.STATE_PEEK] },
    async ($, on) => {
      mock.clock(on)

      const stored = Fixtures.storeOn(on, {
        sources: [HN, ADDED],
        settings: { refreshMinutes: 60, rotateSeconds: 9, lang: 'es', template: '{url}' },
        items: { 'hacker-news': [HN_ITEM], added: [Fixtures.itemAt('a')] },
        seen: { 'hacker-news': ['hacker-news:h'], added: ['src:a'] },
        saved: [SAVED],
      })

      Fixtures.webOn(on, new Map())
      Fixtures.logsOn(on)
      on('model.complete', () => ({ deny: 'offline' }))

      expect((await $.command.run(Fixtures.heraldOf('reset'))).text).toBe(
        'Restored the 10 factory sources and the default settings, removed 1 added source; kept 1 saved item.',
      )
      expect(stored.get('sources')).toEqual([...Defaults.FACTORY_SOURCES])
      expect(stored.get('settings')).toEqual(Defaults.DEFAULT_SETTINGS)
      expect(stored.get('saved')).toEqual([SAVED])
      expect(stored.get('items')).toEqual({ 'hacker-news': [HN_ITEM] })
      expect(stored.get('seen')).toEqual({ 'hacker-news': ['hacker-news:h'] })
      expect(peeked((await $.command.run(Fixtures.PEEK)).text)).toMatchObject({
        sources: [...Defaults.FACTORY_SOURCES],
        settings: Defaults.DEFAULT_SETTINGS,
      })
    },
  )

  test('restarts the refresh timer at the default interval', async ($, on) => {
    const clock = mock.clock(on)

    Fixtures.storeOn(on, { sources: [], settings: { refreshMinutes: 60 } })
    Fixtures.registerOn(on)
    Fixtures.logsOn(on)
    on('model.complete', () => ({ deny: 'offline' }))
    on('session.start', () => ({ cwd: '/work' }))

    const fetched = Fixtures.webOn(on, new Map())

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    expect(fetched).toEqual([])

    await $.command.run(Fixtures.heraldOf('reset'))
    await clock.settle()

    const once = fetched.length

    expect(once).toBeGreaterThan(0)

    await clock.advance(5 * 60_000)

    expect(fetched.length).toBe(2 * once)
  })

  test(
    'from a band of five, the selected item stays selected on the page of three that holds it',
    { timeoutMs: 30_000 },
    async ($, on) => {
      mock.clock(on)
      Fixtures.bandOn(on, {
        sources: [...Defaults.FACTORY_SOURCES],
        items: { 'hacker-news': Fixtures.datedItemsOf('hacker-news', 12) },
        settings: { bandSize: 5 },
      })

      await $.classic.SessionStart({ source: 'clear' })

      const ui = await $.ui.mount({
        plugin: 'herald',
        component: 'AbovePrompt',
        props: Fixtures.BAND_PROPS,
        surface: 'terminal',
      })
      const rangeOf = async () => (await ui.find({ type: 'Text', text: / of \d+$/ }))?.text
      const selectedOf = async () => {
        const [bold] = (await ui.findAll({ type: 'Text' })).filter(
          text => text.props.bold === true && text.text !== 'Herald',
        )

        return (bold?.children[0] as { props: { href?: unknown } } | undefined)?.props.href
      }

      await ui.press({ key: 'next' })
      await ui.press({ key: 'down' })

      expect([await rangeOf(), await selectedOf()]).toEqual([
        '6–10 of 12',
        'https://example.com/hacker-news/7',
      ])

      await $.command.run(Fixtures.heraldOf('reset'))

      expect([await rangeOf(), await selectedOf()]).toEqual([
        '7–9 of 12',
        'https://example.com/hacker-news/7',
      ])
    },
  )
})
