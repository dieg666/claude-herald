import { describe, expect, mock, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'
import Stack from '../../hooks/deps/stack'
import Fixtures from '../fixtures'
import Feeds from '../fixtures/feeds'

describe('run-herald', () => {
  const USAGES = [
    '/herald ',
    ...Object.values(Commands.SUBCOMMANDS).map(subcommand => `/herald ${subcommand.usage}`),
    '/herald help',
  ]

  const expectUsage = (text: string | undefined) => {
    for (const usage of USAGES) {
      expect(text).toContain(usage)
    }
  }

  test('the usage lists /herald, every subcommand and help', async ($, on) => {
    Fixtures.storeOn(on, { sources: [] })

    const { text } = await $.command.run(Fixtures.heraldOf('help'))

    expect(text?.startsWith('Usage:\n')).toBe(true)
    expectUsage(text)
    expect(Object.keys(Commands.SUBCOMMANDS)).toEqual([
      'add',
      'add-page',
      'remove',
      'list',
      'enable',
      'disable',
      'band',
      'pane',
      'interval',
      'rotate',
      'summaries',
      'lang',
      'template',
      'reset',
      'deps',
    ])
  })

  test('an unknown subcommand answers the usage, saving nothing', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [] })

    for (const args of ['frobnicate', 'constructor', '__proto__', '"add"']) {
      const { text } = await $.command.run(Fixtures.heraldOf(args))

      expect(text?.startsWith(`/herald has no "${args}" subcommand.\n\n`)).toBe(true)
      expectUsage(text)
    }

    expect([...stored.keys()]).toEqual(['sources'])
  })

  test('a subcommand missing its argument answers the usage', async ($, on) => {
    Fixtures.storeOn(on, { sources: [] })

    for (const name of [
      'add',
      'add-page',
      'remove',
      'enable',
      'disable',
      'band',
      'pane',
      'interval',
      'rotate',
    ]) {
      const { text } = await $.command.run(Fixtures.heraldOf(`${name}   `))

      expect(text).toMatch(new RegExp(`^/herald ${name} .*: the argument is missing\\.\\n\\n`))
      expectUsage(text)
    }

    for (const name of ['lang', 'template']) {
      expectUsage((await $.command.run(Fixtures.heraldOf(`${name} ""`))).text)
    }
  })

  test('subcommand names ignore case and surrounding spaces', async ($, on) => {
    Fixtures.storeOn(on, { sources: [Fixtures.sourceAt('one')] })

    expect((await $.command.run(Fixtures.heraldOf('  LIST  '))).text).toMatch(
      /^1 of 1 sources enabled; /,
    )
  })

  test('a failure inside a subcommand answers text and logs to debug', async ($, on) => {
    const logs = Fixtures.logsOn(on)

    on('store.get', () => ({ deny: 'store unavailable' }))

    const { text } = await $.command.run(Fixtures.heraldOf('list'))

    expect(text).toMatch(/^\/herald list failed: .*store unavailable/)
    expect(logs).toEqual([expect.stringMatching(/^debug: herald: \/herald list: /)])
  })

  test('a failure whose debug line the engine refuses still answers its text', async ($, on) => {
    on('store.get', () => ({ deny: 'store unavailable' }))
    on('ui.log', () => ({ deny: 'logging refused' }))

    expect((await $.command.run(Fixtures.heraldOf('list'))).text).toMatch(
      /^\/herald list failed: .*store unavailable/,
    )
    expect((await $.command.run(Fixtures.heraldOf('list\n/herald list'))).text).toMatch(
      /\/herald list failed: .*store unavailable/,
    )
  })

  test('every subcommand answers a non-empty text, success or refusal', async ($, on) => {
    mock.clock(on)
    Fixtures.storeOn(on, { sources: [Fixtures.sourceAt('one')] })
    Fixtures.webOn(on, new Map())
    Fixtures.paneOn(on, [])
    Fixtures.logsOn(on)
    on('model.complete', () => ({ deny: 'offline' }))

    for (const args of [
      '',
      'help',
      'add https://example.org/x.xml',
      'add-page https://example.org/x',
      'remove nope',
      'list',
      'enable nope',
      'disable one',
      'band off one',
      'pane on nope',
      'pane maybe one',
      'interval 7',
      'interval x',
      'rotate 30',
      'rotate 1',
      'lang es',
      'lang english',
      'template {title}',
      'template {nope}',
      'reset',
      'whatever',
    ]) {
      const { text } = await $.command.run(Fixtures.heraldOf(args))

      expect(typeof text === 'string' && text.trim() !== '', `/herald ${args}`).toBe(true)
    }
  })

  test('pasted add commands each add their feed, in order, a quoted name kept', async ($, on) => {
    const clock = mock.clock(on)
    const stored = Fixtures.storeOn(on, { sources: [] })

    Fixtures.webOn(
      on,
      new Map([
        ['https://a.example/feed.xml', Feeds.rssWithItems(1)],
        ['https://b.example/feed.xml', Feeds.rssWithItems(2)],
      ]),
    )

    const { text } = await $.command.run(
      Fixtures.heraldOf(
        'add https://a.example/feed.xml\n/herald add https://b.example/feed.xml "B news"',
      ),
    )

    await clock.settle()

    expect(text).toBe(
      [
        '/herald add https://a.example/feed.xml',
        'Added "Big" with 1 entry. /herald remove Big stops following it.',
        '',
        '/herald add https://b.example/feed.xml "B news"',
        'Added "B news" with 2 entries. /herald remove "B news" stops following it.',
      ].join('\n'),
    )
    expect((stored.get('sources') as { name: string; url: string }[]).map(s => s.name)).toEqual([
      'Big',
      'B news',
    ])
  })

  test('mixed subcommands run in order, a later line acting on what an earlier one did', async ($, on) => {
    mock.clock(on)
    Fixtures.storeOn(on, { sources: [] })
    Fixtures.webOn(on, new Map([['https://a.example/feed.xml', Feeds.rssWithItems(1)]]))

    const { text } = await $.command.run(
      Fixtures.heraldOf('add https://a.example/feed.xml Mine\n/herald disable Mine\n/herald list'),
    )

    expect(text?.split('\n\n').map(block => block.split('\n')[0])).toEqual([
      '/herald add https://a.example/feed.xml Mine',
      '/herald disable Mine',
      '/herald list',
    ])
    expect(text).toContain('/herald disable Mine\nDisabled "Mine"')
    expect(text).toMatch(/\/herald list\n0 of 1 sources enabled; /)
  })

  test('blank lines, surrounding spaces, any case of /herald and CRLF or CR breaks are taken in stride', async ($, on) => {
    const stored = Fixtures.storeOn(on, {
      sources: ['one', 'two', 'three'].map(id => Fixtures.sourceAt(id)),
    })

    const { text } = await $.command.run(
      Fixtures.heraldOf(
        '\r\n  disable one  \r\n\r\n   /HERALD disable two\r/Herald  disable three\r\n\r\n',
      ),
    )

    expect(text).toBe(
      ['one', 'two', 'three']
        .map(
          id =>
            `/herald disable ${id}\nDisabled "${id}"; it is kept but no longer fetched or shown.`,
        )
        .join('\n\n'),
    )
    expect((stored.get('sources') as { isEnabled: boolean }[]).map(s => s.isEnabled)).toEqual([
      false,
      false,
      false,
    ])
  })

  test('a bad command in the middle answers its own error and the commands after it still run', async ($, on) => {
    const stored = Fixtures.storeOn(on, {
      sources: [Fixtures.sourceAt('one'), Fixtures.sourceAt('two')],
    })

    const { text } = await $.command.run(
      Fixtures.heraldOf(
        'disable one\n/herald frobnicate\n/help me\n/herald add\n/herald disable two',
      ),
    )
    const blocks = text?.split(/\n\n(?=\/)/) ?? []

    expect(blocks.map(block => block.split('\n')[0])).toEqual([
      '/herald disable one',
      '/herald frobnicate',
      '/help me',
      '/herald add',
      '/herald disable two',
    ])
    expect(blocks[1]).toMatch(
      /^\/herald frobnicate\n\/herald has no "frobnicate" subcommand\.\n\nUsage:/,
    )
    expect(blocks[2]).toBe('/help me\n/help is not a /herald command, so it did not run.')
    expect(blocks[3]).toMatch(/^\/herald add\n\/herald add .*: the argument is missing\./)
    expect((stored.get('sources') as { isEnabled: boolean }[]).map(s => s.isEnabled)).toEqual([
      false,
      false,
    ])
  })

  test('a failing command answers its failure and the next command still runs', async ($, on) => {
    const logs = Fixtures.logsOn(on)
    const stored = new Map<string, unknown>([['sources', [Fixtures.sourceAt('one')]]])
    let gets = 0

    on('store.get', ($, e) =>
      ++gets === 1 ? { deny: 'store unavailable' } : { value: stored.get(e.key) },
    )
    on('store.set', ($, e) => {
      stored.set(e.key, e.value)

      return { value: undefined }
    })

    const { text } = await $.command.run(Fixtures.heraldOf('list\n/herald disable one'))

    expect(text).toMatch(
      /^\/herald list\n\/herald list failed: .*store unavailable\n\n\/herald disable one\nDisabled "one"/,
    )
    expect(logs).toEqual([expect.stringMatching(/^debug: herald: \/herald list: /)])
  })

  for (const surface of ['terminal', 'desktop'] as const) {
    test(`a bare /herald among several commands opens no pane on the ${surface} and says so`, async ($, on) => {
      Fixtures.storeOn(on, { sources: [Fixtures.sourceAt('one'), Fixtures.sourceAt('two')] })

      const opened = Fixtures.paneOn(on, [surface])

      const { text } = await $.command.run(
        Fixtures.heraldOf('disable one\n/herald\n/herald disable two'),
      )

      expect(opened).toEqual([])
      expect(text).toContain(
        '\n\n/herald\n/herald alone opens the pane, which it does not do among several commands; run it on its own.\n\n/herald disable two\n',
      )
    })
  }

  test('help among several commands answers the usage under its command', async ($, on) => {
    Fixtures.storeOn(on, { sources: [Fixtures.sourceAt('one')] })

    const list = (await $.command.run(Fixtures.heraldOf('list'))).text
    const { text } = await $.command.run(Fixtures.heraldOf('/herald help\n/herald list'))

    expect(text).toBe(
      `/herald help\n${Commands.usageTextOf(Commands.SUBCOMMANDS)}\n\n/herald list\n${list}`,
    )
  })

  test('one command among blank lines answers exactly as it does alone', async ($, on) => {
    Fixtures.storeOn(on, { sources: [Fixtures.sourceAt('one')] })

    const alone = (await $.command.run(Fixtures.heraldOf('list'))).text

    expect((await $.command.run(Fixtures.heraldOf('\n  list  \r\n\n'))).text).toBe(alone)
  })

  test('a paste starting with a bare /herald line answers it, then runs the /herald lines after it', async ($, on) => {
    const stored = Fixtures.storeOn(on, {
      sources: [Fixtures.sourceAt('one'), Fixtures.sourceAt('two')],
    })
    const opened = Fixtures.paneOn(on, ['terminal'])
    const BARE =
      '/herald\n/herald alone opens the pane, which it does not do among several commands; run it on its own.'
    const disabled = (id: string) =>
      `/herald disable ${id}\nDisabled "${id}"; it is kept but no longer fetched or shown.`

    expect((await $.command.run(Fixtures.heraldOf('\n/herald disable one'))).text).toBe(
      [BARE, disabled('one')].join('\n\n'),
    )
    const three = await $.command.run(
      Fixtures.heraldOf('  \r\n/herald disable two\r\n/HERALD list'),
    )

    expect(
      three.text?.startsWith(`${BARE}\n\n${disabled('two')}\n\n/herald list\n0 of 2 sources`),
      three.text,
    ).toBe(true)
    expect(opened).toEqual([])
    expect((stored.get('sources') as { isEnabled: boolean }[]).map(s => s.isEnabled)).toEqual([
      false,
      false,
    ])
  })

  test('a paste asks for every follow-up its commands asked for', async () => {
    const { host } = Fixtures.fakeHostOf({ sources: [] })

    expect(
      await Commands.runHerald(host, 'interval 7\n/herald rotate 30', Stack.stackLoopOf()),
    ).toMatchObject({ restartRefresh: true, restartRotation: true })
  })

  test('an interruption stops before the next command and lists the commands left unrun', async () => {
    const fake = Fixtures.fakeHostOf({
      sources: ['one', 'two', 'three'].map(id => Fixtures.sourceAt(id)),
    })
    const stop = new AbortController()
    const host = {
      ...fake.host,
      storeSet: async (key: string, value: unknown) => {
        await fake.host.storeSet(key, value)
        stop.abort()
      },
    }

    const reply = await Commands.runHerald(
      host,
      'disable one\n/herald disable two\n/herald disable three',
      Stack.stackLoopOf(),
      undefined,
      stop.signal,
    )

    expect(reply.text).toBe(
      '/herald disable one\nDisabled "one"; it is kept but no longer fetched or shown.\n\nInterrupted, so these commands did not run:\n/herald disable two\n/herald disable three',
    )
    expect((fake.stored.get('sources') as { isEnabled: boolean }[]).map(s => s.isEnabled)).toEqual([
      false,
      true,
      true,
    ])
  })

  test('a line not starting with / continues the command above it, so a pasted template keeps its line break', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [Fixtures.sourceAt('one')] })

    const { text } = await $.command.run(
      Fixtures.heraldOf(
        'template Does this matter?\n{title} {url}\n/herald deps template We use {pkg}.\n\n  See {url}\n/herald disable one\n',
      ),
    )

    expect(stored.get('settings')).toMatchObject({
      template: 'Does this matter?\n{title} {url}',
      depsTemplate: 'We use {pkg}.\n\n  See {url}',
    })
    expect(text).toBe(
      [
        '/herald template Does this matter?\n{title} {url}',
        'Copy for Claude now copies: Does this matter?\n{title} {url}',
        '',
        '/herald deps template We use {pkg}.\n\n  See {url}',
        'Copy for Claude now copies, for a dependency release: We use {pkg}.\n\n  See {url}',
        '',
        '/herald disable one',
        'Disabled "one"; it is kept but no longer fetched or shown.',
      ].join('\n'),
    )
  })

  test('a template typed over several lines alone is one command, saved whole as before', async ($, on) => {
    const stored = Fixtures.storeOn(on)

    expect(
      (await $.command.run(Fixtures.heraldOf('template Read this\r\n{title}\n\nlist {url}'))).text,
    ).toBe('Copy for Claude now copies: Read this\r\n{title}\n\nlist {url}')
    expect(stored.get('settings')).toMatchObject({ template: 'Read this\r\n{title}\n\nlist {url}' })
  })

  test('a bare /herald line followed by lines without a slash runs them as its subcommand', async ($, on) => {
    const stored = Fixtures.storeOn(on, {
      sources: [Fixtures.sourceAt('one'), Fixtures.sourceAt('two')],
    })
    const opened = Fixtures.paneOn(on, ['terminal'])

    const { text } = await $.command.run(Fixtures.heraldOf('disable one\n/herald\ndisable two'))

    expect(opened).toEqual([])
    expect(text).toContain('\n\n/herald disable two\nDisabled "two"')
    expect((stored.get('sources') as { isEnabled: boolean }[]).map(s => s.isEnabled)).toEqual([
      false,
      false,
    ])
  })
})
