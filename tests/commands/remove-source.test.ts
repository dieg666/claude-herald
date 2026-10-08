import { describe, expect, mock, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'
import Fixtures from '../fixtures'
import Feeds from '../fixtures/feeds'

describe('remove-source', () => {
  const ONE = Fixtures.sourceAt('one', { name: 'First Feed' })
  const TWO = Fixtures.sourceAt('two', { url: 'https://example.com/two/' })
  const ITEM = { ...Fixtures.itemAt('a'), id: 'one:a', sourceId: 'one' }
  const SAVED = { ...ITEM, savedAt: 5 }

  const peeked = (text: string | undefined) =>
    JSON.parse(text ?? 'null') as { sources: unknown; items: unknown; saved: unknown }

  test(
    'removes by name in any case and forgets its items, seen ids and page hash; saved items stay',
    { plugins: [Fixtures.STATE_PEEK] },
    async ($, on) => {
      const stored = Fixtures.storeOn(on, {
        sources: [ONE, TWO],
        items: { one: [ITEM], two: [] },
        seen: { one: ['one:a'], two: [] },
        pageHashes: { one: 'h1', two: 'h2' },
        saved: [SAVED],
      })

      on('classic.SessionStart', () => ({}))
      await $.classic.SessionStart({ source: 'clear' })

      const { text } = await $.command.run(Fixtures.heraldOf('remove   first   FEED'))

      expect(text).toBe('Removed "First Feed".')
      expect(stored.get('sources')).toEqual([TWO])
      expect(stored.get('items')).toEqual({ two: [] })
      expect(stored.get('seen')).toEqual({ two: [] })
      expect(stored.get('pageHashes')).toEqual({ two: 'h2' })
      expect(stored.get('saved')).toEqual([SAVED])
      expect(peeked((await $.command.run(Fixtures.PEEK)).text)).toMatchObject({
        sources: [TWO],
        items: { two: [] },
        saved: [SAVED],
      })
    },
  )

  test('removes by address, a trailing slash aside, and by id', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [ONE, TWO] })

    expect((await $.command.run(Fixtures.heraldOf('remove https://example.com/two'))).text).toBe(
      'Removed "two".',
    )
    expect((await $.command.run(Fixtures.heraldOf('remove one'))).text).toBe(
      'Removed "First Feed".',
    )
    expect(stored.get('sources')).toEqual([])
  })

  test('an unknown name or address is refused and nothing changes', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [ONE, TWO] })

    expect((await $.command.run(Fixtures.heraldOf('remove nope'))).text).toBe(
      'No source is named "nope". /herald list shows them.',
    )
    expect((await $.command.run(Fixtures.heraldOf('remove https://example.com/x'))).text).toBe(
      'No source reads https://example.com/x.',
    )
    expect(stored.get('sources')).toEqual([ONE, TWO])
  })

  test('two sources with the same name ask for the address instead', async ($, on) => {
    const twin = Fixtures.sourceAt('twin', { name: 'first feed' })
    const stored = Fixtures.storeOn(on, { sources: [ONE, twin] })

    expect((await $.command.run(Fixtures.heraldOf('remove First Feed'))).text).toBe(
      '2 sources are named "First Feed"; name it by its address instead.',
    )
    expect(stored.get('sources')).toEqual([ONE, twin])
  })

  test('a removed factory source comes back with /herald reset', async ($, on) => {
    mock.clock(on)

    const hn = Defaults.FACTORY_SOURCES[6]
    const stored = Fixtures.storeOn(on, { sources: [...Defaults.FACTORY_SOURCES] })

    Fixtures.webOn(on, new Map())
    Fixtures.logsOn(on)
    on('model.complete', () => ({ deny: 'offline' }))

    expect((await $.command.run(Fixtures.heraldOf('remove hacker news'))).text).toBe(
      'Removed "Hacker News". /herald reset brings the factory sources back.',
    )
    expect(stored.get('sources')).not.toContainEqual(hn)

    await $.command.run(Fixtures.heraldOf('reset'))

    expect(stored.get('sources')).toEqual([...Defaults.FACTORY_SOURCES])
  })

  test('a name with an apostrophe is found unquoted', async ($, on) => {
    const blog = Fixtures.sourceAt('simons-blog', { name: "Simon's Blog" })
    const stored = Fixtures.storeOn(on, { sources: [ONE, blog] })

    expect((await $.command.run(Fixtures.heraldOf("remove Simon's Blog"))).text).toBe(
      `Removed "Simon's Blog".`,
    )
    expect(stored.get('sources')).toEqual([ONE])
  })

  test('a source removed while its refresh is in flight gets nothing written back', async ($, on) => {
    const clock = mock.clock(on)
    const stored = Fixtures.storeOn(on, { sources: [TWO], settings: { refreshMinutes: 1 } })
    let calls = 0
    let release: () => void = () => undefined
    const held = new Promise<void>(resolve => {
      release = resolve
    })

    // The first refresh fails and writes nothing; the timer's next one waits for the release.
    on('http.fetch', async () => {
      calls += 1

      if (calls === 1) {
        return { value: { status: 503, ok: false, headers: {}, text: '' } }
      }

      await held

      return { value: { status: 200, ok: true, headers: {}, text: Feeds.rssWithItems(2) } }
    })
    Fixtures.registerOn(on)
    Fixtures.logsOn(on)
    on('session.start', () => ({ cwd: '/work' }))

    await $.session.start(Fixtures.SESSION)
    await clock.settle()
    await clock.advance(60_000)

    expect(calls).toBe(2)
    expect((await $.command.run(Fixtures.heraldOf('remove two'))).text).toBe('Removed "two".')

    release()
    await clock.settle()

    expect(stored.get('sources')).toEqual([])
    expect(stored.get('items') ?? {}).toEqual({})
    expect(stored.get('seen') ?? {}).toEqual({})
  })
})
