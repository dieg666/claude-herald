import { describe, expect, test } from 'claude-code/testing'

import Fixtures from '../fixtures'

describe('show-news', () => {
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

      expect((await $.command.run(Fixtures.newsOf(''))).text).toBe('Opened the news pane.')
      expect(opened).toEqual([{ id: 'news', title: 'News', focus: true, closeOnEscape: true }])
    })
  }

  test('with no surface attached, answers the latest items of every enabled source', async ($, on) => {
    Fixtures.storeOn(on, STORE)

    const opened = Fixtures.paneOn(on, [])

    expect((await $.command.run(Fixtures.newsOf(''))).text).toBe(DIGEST)
    expect(opened).toEqual([])
  })

  test('on surfaces that draw no pane, answers the digest too', async ($, on) => {
    Fixtures.storeOn(on, STORE)

    const opened = Fixtures.paneOn(on, ['vscode', 'mobile'])

    expect((await $.command.run(Fixtures.newsOf('   '))).text).toBe(DIGEST)
    expect(opened).toEqual([])
  })

  test('a pane that waits for room says why', async ($, on) => {
    Fixtures.storeOn(on, STORE)
    Fixtures.paneOn(on, ['terminal'], { isPlaced: false, reason: 'needs 144 columns' })

    expect((await $.command.run(Fixtures.newsOf(''))).text).toBe(
      'The news pane is open and shows once there is room: needs 144 columns',
    )
  })

  test('a refused pane falls back to the digest, logged to debug', async ($, on) => {
    Fixtures.storeOn(on, STORE)

    const logs = Fixtures.logsOn(on)

    on('session.surfaces', () => ({ value: ['terminal'] }))
    on('ui.open', () => ({ deny: 'no panes here' }))

    expect((await $.command.run(Fixtures.newsOf(''))).text).toBe(DIGEST)
    expect(logs).toEqual([expect.stringMatching(/^debug: news: could not open the pane: /)])
  })

  test('with every source off, says how to turn one on', async ($, on) => {
    Fixtures.storeOn(on, { sources: [OFF] })
    Fixtures.paneOn(on, [])

    expect((await $.command.run(Fixtures.newsOf(''))).text).toBe(
      'Every source is off. /news list shows them; /news enable <name> turns one on.',
    )
  })
})
