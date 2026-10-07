import { describe, expect, mock, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'
import Fixtures from '../fixtures'

describe('reset-news', () => {
  const ADDED = Fixtures.sourceAt('added')
  const SAVED = { ...Fixtures.itemAt('s'), savedAt: 3 }
  const HN = { ...Defaults.FACTORY_SOURCES[6], isEnabled: false }
  const HN_ITEM = { ...Fixtures.itemAt('h'), id: 'hacker-news:h', sourceId: 'hacker-news' }

  const peeked = (text: string | undefined) =>
    JSON.parse(text ?? 'null') as { sources: unknown; settings: unknown; saved: unknown }

  test(
    'restores the factory sources and default settings, drops added sources, keeps saved items',
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

      expect((await $.command.run(Fixtures.newsOf('reset'))).text).toBe(
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

    await $.command.run(Fixtures.newsOf('reset'))
    await clock.settle()

    const once = fetched.length

    expect(once).toBeGreaterThan(0)

    await clock.advance(5 * 60_000)

    expect(fetched.length).toBe(2 * once)
  })
})
