import { describe, expect, mock, test } from 'claude-code/testing'

import Fixtures from '../fixtures'

describe('list-sources', () => {
  test('lists every source: on or off, kind, item count, name and address', async ($, on) => {
    Fixtures.storeOn(on, {
      sources: [
        Fixtures.sourceAt('feed', { name: 'A feed' }),
        Fixtures.sourceAt('page', { kind: 'page', isEnabled: false }),
      ],
      items: { feed: [Fixtures.itemAt('a'), Fixtures.itemAt('b')] },
    })

    expect((await $.command.run(Fixtures.heraldOf('list'))).text).toBe(
      [
        '1 of 2 sources enabled:',
        '  on   feed   2 items  A feed  https://example.com/feed.xml',
        '  off  page   0 items  page  https://example.com/page.xml',
      ].join('\n'),
    )
  })

  test("shows a source's last refresh error below it", async ($, on) => {
    const clock = mock.clock(on)
    const feed = Fixtures.sourceAt('feed')

    Fixtures.storeOn(on, { sources: [feed] })
    Fixtures.webOn(on, new Map([[feed.url, { status: 503, text: '' }]]))
    Fixtures.registerOn(on)
    Fixtures.logsOn(on)
    on('session.start', () => ({ cwd: '/work' }))

    await $.session.start(Fixtures.SESSION)
    await clock.settle()

    expect((await $.command.run(Fixtures.heraldOf('list'))).text).toBe(
      [
        '1 of 1 sources enabled:',
        '  on   feed   0 items  feed  https://example.com/feed.xml',
        '       last error: HTTP 503',
      ].join('\n'),
    )
  })

  test('with no sources, says how to add one or restore the factory ones', async ($, on) => {
    Fixtures.storeOn(on, { sources: [] })

    expect((await $.command.run(Fixtures.heraldOf('list'))).text).toBe(
      'No sources. /herald add <url> [name] follows a feed; /herald reset restores the factory sources.',
    )
  })
})
